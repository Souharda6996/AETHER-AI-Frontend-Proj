import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import Papa from "papaparse";

// Initialize PDF.js worker using a reliable CDN that matches the installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const extractTextFromFile = async (file: File): Promise<string> => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  try {
    // 1. PDF Files
    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      return await parsePDF(file);
    }
    
    // 2. DOCX Files
    if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fileName.endsWith(".docx")) {
      return await parseDocx(file);
    }

    // 3. CSV / Spreadsheets
    if (fileType === "text/csv" || fileName.endsWith(".csv")) {
      return await parseCSV(file);
    }

    // 4. Plain Text / Code / JSON / HTML / Markdown
    if (
      fileType.startsWith("text/") || 
      fileType === "application/json" ||
      fileName.match(/\.(txt|md|js|ts|py|html|css|json|yaml|xml)$/)
    ) {
      return await parseText(file);
    }

    // 5. Images (Returns Base64 directly, handled differently in ChatPage if needed, 
    // but here we can just return a marker or actual base64)
    if (fileType.startsWith("image/")) {
      return await fileToBase64(file);
    }

    // 6. Fallback - Try to read as plain text
    try {
      return await parseText(file);
    } catch {
      throw new Error(`Unsupported file type: ${file.type} (${file.name}) and could not be read as text.`);
    }
  } catch (error) {
    console.error("Error parsing file:", error);
    throw new Error(`Failed to read ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const parsePDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
  }
  return fullText;
};

const parseDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const parseCSV = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        // Convert array of arrays back to a formatted string table
        const rows = results.data.map((row: any) => row.join(" | ")).join("\n");
        resolve(rows);
      },
      error: (error) => reject(error),
    });
  });
};

const parseText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

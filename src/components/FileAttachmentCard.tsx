import React from "react";
import { 
  FileText, FileCode, MessageSquare, Image as ImageIcon, 
  File as FileIcon, X, Video, Headphones, Table, Presentation
} from "lucide-react";

interface FileAttachmentCardProps {
  name: string;
  type: string;
  size?: number;
  previewUrl?: string; // For images
  onRemove?: () => void;
  isDarkMode?: boolean;
}

const FILE_TYPE_COLORS: Record<string, { color: string, bg: string, label: string, Icon: any }> = {
  pdf:  { color: "#ef4444", bg: "#fef2f2", label: "PDF", Icon: FileText },
  doc:  { color: "#3b82f6", bg: "#eff6ff", label: "Word", Icon: FileText },
  docx: { color: "#3b82f6", bg: "#eff6ff", label: "Word", Icon: FileText },
  txt:  { color: "#64748b", bg: "#f8fafc", label: "Text", Icon: FileText },
  xlsx: { color: "#22c55e", bg: "#f0fdf4", label: "Excel", Icon: Table },
  xls:  { color: "#22c55e", bg: "#f0fdf4", label: "Excel", Icon: Table },
  csv:  { color: "#22c55e", bg: "#f0fdf4", label: "CSV", Icon: Table },
  pptx: { color: "#f97316", bg: "#fff7ed", label: "PPT", Icon: Presentation },
  ppt:  { color: "#f97316", bg: "#fff7ed", label: "PPT", Icon: Presentation },
  js:   { color: "#eab308", bg: "#fefce8", label: "JS", Icon: FileCode },
  ts:   { color: "#0ea5e9", bg: "#f0f9ff", label: "TS", Icon: FileCode },
  py:   { color: "#10b981", bg: "#ecfdf5", label: "Python", Icon: FileCode },
  html: { color: "#f43f5e", bg: "#fff1f2", label: "HTML", Icon: FileCode },
  css:  { color: "#6366f1", bg: "#eef2ff", label: "CSS", Icon: FileCode },
  json: { color: "#d946ef", bg: "#fdf4ff", label: "JSON", Icon: FileCode },
  mp4:  { color: "#8b5cf6", bg: "#f5f3ff", label: "Video", Icon: Video },
  mp3:  { color: "#ec4899", bg: "#fdf2f8", label: "Audio", Icon: Headphones },
  default: { color: "#94a3b8", bg: "#f1f5f9", label: "File", Icon: FileIcon }
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileAttachmentCard: React.FC<FileAttachmentCardProps> = ({ 
  name, type, size, previewUrl, onRemove, isDarkMode = true 
}) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const isImage = type.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  const config = isImage ? { color: "#a855f7", bg: "#f3e8ff", label: "Image", Icon: ImageIcon } : (FILE_TYPE_COLORS[ext] || FILE_TYPE_COLORS.default);

  return (
    <div className={`flex items-center gap-3 p-2 pr-3 rounded-xl border transition-all duration-200 min-w-[180px] max-w-[280px] shadow-sm select-none
      ${isDarkMode 
        ? "bg-[#1E1E1E]/80 border-[#333] hover:bg-[#252525]/90" 
        : "bg-white border-gray-200 hover:bg-gray-50"
      }`}
    >
      {/* Icon Section */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden" 
           style={{ backgroundColor: isImage && previewUrl ? "transparent" : config.color + "20" }}>
        {isImage && previewUrl ? (
          <img src={previewUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <config.Icon className="w-5 h-5" style={{ color: config.color }} />
        )}
      </div>

      {/* Info Section */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-[13px] font-semibold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          {name}
        </h4>
        <p className={`text-[11px] font-medium uppercase tracking-tight ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          {config.label} {size ? `• ${formatFileSize(size)}` : ""}
        </p>
      </div>

      {/* Action Section */}
      {onRemove && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className={`flex-shrink-0 p-1.5 rounded-full transition-colors
            ${isDarkMode ? "text-gray-500 hover:bg-white/10 hover:text-white" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default FileAttachmentCard;

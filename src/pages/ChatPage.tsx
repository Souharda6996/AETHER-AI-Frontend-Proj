import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../custom-markdown.css";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { 
  collection, query, orderBy, onSnapshot, addDoc, 
  serverTimestamp, updateDoc, doc 
} from "firebase/firestore";
import { 
  Send, Bot, User, Plus, MessageSquare, Settings, LogOut, 
  Share2, Zap, Command, ArrowLeft, Square, Copy, Check, 
  ThumbsUp, ThumbsDown, RefreshCw, Menu, X, Pause, Play, Download, FileText, Image, FileCode, Paperclip, HardDrive, Camera, Code as CodeIcon, XCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import { downloadAsText, downloadAsPDF, downloadAsImage } from "../utils/downloadUtils";
import { extractTextFromFile, fileToBase64 } from "../utils/fileParser";
import FileAttachmentCard from "../components/FileAttachmentCard";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: any;
  feedback?: "positive" | "negative" | null;
  attachments?: Array<{
    name: string;
    type: string;
    size?: number;
    previewUrl?: string;
  }>;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: any;
  createdAt: any;
}

export interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'document' | 'video' | 'code' | 'other';
  status: 'pending' | 'uploading' | 'done' | 'error';
  extractedText?: string;
}

const API_KEY = import.meta.env.VITE_API_KEY || "[PASTE YOUR KEY HERE]";

if (!API_KEY || API_KEY === "[PASTE YOUR GROQ API KEY HERE]" || API_KEY === "[PASTE YOUR KEY HERE]") {
  console.error("API KEY IS MISSING!");
}

const ChatPage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-1",
      role: "assistant",
      content: "Welcome back. I am Aether, your autonomous agent mesh. How can I assist your intelligence operations today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [displayedStreamingMessage, setDisplayedStreamingMessage] = useState("");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => {
        let type: UploadedFile['type'] = 'other';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) type = 'document';
        else if (file.name.match(/\.(js|ts|py|html|css|json)$/)) type = 'code';

        return {
          id: crypto.randomUUID(),
          file,
          previewUrl: type === 'image' ? URL.createObjectURL(file) : '',
          type,
          status: 'pending' as const
        };
      });
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      return prev.filter(f => f.id !== id);
    });
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages, displayedStreamingMessage]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "users", currentUser.uid, "conversations"),
      orderBy("updatedAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setConversations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation)));
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !activeConversationId) return;
    const q = query(
      collection(db, "users", currentUser.uid, "conversations", activeConversationId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      if (!snapshot.empty) {
        setMessages(prev => {
          // Keep local assistant messages (errors or thinking) that aren't in Firestore yet
          const localOnly = prev.filter(p => p.role === 'assistant' && !firestoreMsgs.some(f => f.id === p.id));
          return [...firestoreMsgs, ...localOnly].sort((a,b) => {
            const getMillis = (m: Message) => {
              if (m.timestamp?.toDate) return m.timestamp.toDate().getTime();
              if (m.timestamp) return new Date(m.timestamp).getTime();
              return Date.now(); // Fallback for pending
            };
            return getMillis(a) - getMillis(b);
          });
        });
      } else {
        setMessages([{
          id: "initial-1",
          role: "assistant",
          content: "Welcome back. I am Aether, your autonomous agent mesh. How can I assist your intelligence operations today?",
          timestamp: new Date(),
        }]);
      }
    });
    return () => unsubscribe();
  }, [activeConversationId, currentUser]);

  useEffect(() => {
    if (!isStreaming || !streamingMessage || isPaused) {
      if (!isStreaming) {
        setDisplayedStreamingMessage("");
        setIsPaused(false);
      }
      return;
    }

    if (displayedStreamingMessage.length < streamingMessage.length) {
      const timeout = setTimeout(() => {
        setDisplayedStreamingMessage(streamingMessage.slice(0, displayedStreamingMessage.length + 1));
      }, 30);
      return () => clearTimeout(timeout);
    } else if (displayedStreamingMessage.length === streamingMessage.length && streamingMessage.length > 0) {
      const finalizeMessage = async () => {
        const reply = streamingMessage;
        if (currentUser && activeConversationId) {
          try {
            await addDoc(collection(db, "users", currentUser.uid, "conversations", activeConversationId, "messages"), {
              role: "assistant",
              content: reply,
              timestamp: serverTimestamp()
            });
          } catch (error) {
            console.error('Error finalizing message:', error);
          }
        }
        
        setStreamingMessage("");
        setDisplayedStreamingMessage("");
        setIsStreaming(false);
      };
      finalizeMessage();
    }
  }, [streamingMessage, displayedStreamingMessage, isStreaming, currentUser, activeConversationId]);

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setStreamingMessage("");
    setDisplayedStreamingMessage("");
    setIsStreaming(false);
    setIsPaused(false);
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const sendMessage = async (inputText: string) => {
    const trimmedInput = inputText.trim();
    if ((!trimmedInput && selectedFiles.length === 0) || isStreaming) return;

    let convId = activeConversationId;
    
    if (!convId && currentUser) {
      const convRef = await addDoc(collection(db, "users", currentUser.uid, "conversations"), {
        title: (trimmedInput || "New Session").slice(0, 40) + ((trimmedInput || "New").length > 40 ? "..." : ""),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      convId = convRef.id;
      setActiveConversationId(convId);
    } else if (convId && currentUser) {
      await updateDoc(doc(db, "users", currentUser.uid, "conversations", convId), {
        updatedAt: serverTimestamp()
      });
    }

    const attachments = selectedFiles.map(f => ({
      name: f.file.name,
      type: f.file.type,
      size: f.file.size,
      previewUrl: f.type === 'image' ? f.previewUrl : undefined
    }));

    const userMsg: Message = {
      id:        crypto.randomUUID(),
      role:      'user' as const,
      content:   trimmedInput,
      timestamp: new Date().toISOString(),
      attachments: attachments.length > 0 ? attachments : undefined
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);
    
    let combinedInputText = trimmedInput;
    let base64Images: string[] = [];

    if (selectedFiles.length > 0) {
      setCurrentAgent("Processing Files...");
      for (const fileObj of selectedFiles) {
        try {
          if (fileObj.type === "image") {
            const b64 = await fileToBase64(fileObj.file);
            base64Images.push(b64);
          } else {
            const extracted = await extractTextFromFile(fileObj.file);
            combinedInputText += `\n\n--- Content of ${fileObj.file.name} ---\n${extracted}\n--- End of ${fileObj.file.name} ---\n`;
          }
        } catch (error) {
           console.error(`Failed to parse ${fileObj.file.name}:`, error);
           toast.error(`Could not read ${fileObj.file.name}`);
        }
      }
      setSelectedFiles([]);
      setCurrentAgent(null);
    }

    if (currentUser && convId) {
      await addDoc(collection(db, "users", currentUser.uid, "conversations", convId, "messages"), {
        role: "user",
        content: trimmedInput,
        timestamp: serverTimestamp(),
        attachments: attachments.length > 0 ? attachments : null
      });
    }

    try {
      const API_ENDPOINT = '/api/chat';
      const historyMsgForBackend = { role: 'user', content: combinedInputText };
      const history = [...messages.filter(m => m.id !== "initial-1"), historyMsgForBackend].map(m => ({
        role:    m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

      const controller = new AbortController();
      setAbortController(controller);
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const res = await fetch(API_ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  controller.signal,
        body:    JSON.stringify({ 
          message:  combinedInputText,
          messages: history,
          images: base64Images.length > 0 ? base64Images : undefined
        }),
      });

      clearTimeout(timeoutId);

      if (res.status === 413) {
        throw new Error('The uploaded file or message is too large for the processing engine (Max 50MB local / 4.5MB cloud). Please try a smaller file.');
      }
      
      if (res.status === 404) throw new Error('API route not found. Please ensure the backend server is running.');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const rawText = await res.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`Server returned invalid response (Status ${res.status}).`);
      }

      if (!res.ok) throw new Error(data?.error ?? data?.message ?? `Server error ${res.status}`);

      const reply: string = data?.reply ?? data?.content ?? data?.message ?? data?.text ?? data?.response ?? '';
      if (!reply.trim()) throw new Error('Received empty response from AI');

      setStreamingMessage(reply);
      setDisplayedStreamingMessage("");
      // NOTE: We do NOT set setIsStreaming(false) here. 
      // The Typewriter useEffect will do it when finished typing.

    } catch (err: any) {
      setIsStreaming(false); // Reset on error
      if (err.name === 'AbortError') {
        toast.error("Request timed out after 60 seconds.");
      }
      console.error('❌ sendMessage failed:', err?.message);
      
      const errorContent = err?.name === 'AbortError' 
        ? '⚠️ Request timed out. The server took too long to respond. Please try again.'
        : err?.message?.includes('Payload Too Large')
        ? '⚠️ Files too large for processing.'
        : `⚠️ Error: ${err?.message ?? 'Unknown error'}`;

      setMessages(prev => [...prev, {
        id:        crypto.randomUUID(),
        role:      'assistant' as const,
        content:   errorContent,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      // Only reset non-streaming state here
      setAbortController(null);
    }
  };

  const handleRegenerate = async (msgContent: string) => {
    if (!currentUser || !activeConversationId || isStreaming) return;
    const lastUserMsg = messages.slice().reverse().find(m => m.role === "user");
    if (lastUserMsg) {
      await updateDoc(doc(db, "users", currentUser.uid, "conversations", activeConversationId), {
        updatedAt: serverTimestamp()
      });
      await sendMessage(lastUserMsg.content);
    }
  };

  const handleFeedback = async (msgId: string, type: "positive" | "negative") => {
    if (!currentUser || !activeConversationId) return;
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const newFeedback = msg.feedback === type ? null : type;
    await updateDoc(doc(db, "users", currentUser.uid, "conversations", activeConversationId, "messages", msgId), {
      feedback: newFeedback
    });
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetChat = () => {
    setActiveConversationId(null);
    setMessages([{
      id: "initial-1",
      role: "assistant",
      content: "Neural link reset. New intelligence thread initialized. How can I assist your operations?",
      timestamp: new Date(),
    }]);
    setInput("");
  };

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[#081B1B] text-[#EEE8B2] font-sans">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 md:relative flex flex-col flex-shrink-0 h-full border-r border-[#5A8F76]/30 bg-[#081B1B] p-4 transform transition-transform duration-300 sidebar-gradient overflow-y-auto overflow-x-hidden ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex items-center justify-between px-2 mb-8 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2 group">
            <ArrowLeft className="h-4 w-4 text-[#5A8F76] group-hover:text-[#C18D52] transition-colors" />
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-[#C18D52] animate-pulse" />
              <span className="font-display text-xl tracking-tight text-[#C18D52]">AETHER</span>
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
            <X className="h-5 w-5 text-[#5A8F76]" />
          </button>
        </div>

        <button onClick={resetChat} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#C18D52]/10 to-transparent border border-[#C18D52]/20 text-[#C18D52] hover:from-[#C18D52]/20 transition-all duration-300 mb-6 group flex-shrink-0">
          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-sm font-semibold tracking-wide">New intelligence thread</span>
        </button>

        <div className="flex-1 overflow-y-auto px-1 space-y-2 mb-4 custom-scrollbar min-h-0">
          <span className="text-[10px] font-bold text-[#5A8F76] uppercase tracking-[0.2em] px-2 mb-2 block">Recent Threads</span>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => {
                setActiveConversationId(conv.id);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${activeConversationId === conv.id ? 'bg-[#C18D52]/15 text-[#C18D52] border border-[#C18D52]/20' : 'text-[#5A8F76] hover:bg-[#5A8F76]/10 hover:text-[#96CDB0]'}`}
            >
              <MessageSquare className={`h-4 w-4 shrink-0 ${activeConversationId === conv.id ? 'text-[#C18D52]' : 'text-[#5A8F76] group-hover:text-[#96CDB0]'}`} />
              <span className="text-xs font-medium truncate">{conv.title}</span>
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-[#5A8F76]/20 flex-shrink-0">
          <button className="flex items-center gap-3 w-full px-4 py-2 text-[#5A8F76] hover:text-[#C18D52] transition-colors mb-2">
            <Settings className="h-4 w-4" />
            <span className="text-xs font-semibold">Neural Settings</span>
          </button>
          <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-[#203B37]/30 border border-[#5A8F76]/10">
            <div className="flex items-center gap-3 overflow-hidden">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="h-8 w-8 rounded-lg" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#C18D52] to-[#EEE8B2] flex items-center justify-center text-[10px] font-bold text-[#081B1B] shadow-lg">
                  {(currentUser?.displayName || currentUser?.email || "OP").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col overflow-hidden">
                <span className="text-[11px] font-semibold truncate leading-none text-[#EEE8B2]">{currentUser?.displayName || currentUser?.email?.split('@')[0]}</span>
                <span className="text-[9px] text-[#C18D52] tracking-tighter uppercase font-bold mt-1">Authorized Profile</span>
              </div>
            </div>
            <button onClick={async () => { await logout(); navigate('/login'); }} title="Sign Out">
              <LogOut className="h-4 w-4 text-[#5A8F76] hover:text-[#C18D52] transition-colors cursor-pointer" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex flex-col flex-1 h-full min-h-0 overflow-hidden relative bg-[#F5F2E0]" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(90, 143, 118, 0.04) 39px, rgba(90, 143, 118, 0.04) 40px)`,
        border: '1px solid rgba(193, 141, 82, 0.3)',
        boxShadow: `0 16px 48px rgba(8, 27, 27, 0.35), 0 0 0 1px rgba(193, 141, 82, 0.1) inset`
      }}>
        <header className="flex-shrink-0 h-14 border-b border-rgba(193, 141, 82, 0.2) flex items-center justify-between px-4 md:px-6 bg-gradient-to-r from-[#203B37] to-[#081B1B] z-10 w-full">
          <div className="flex items-center gap-3">
             <button className="md:hidden p-2 rounded-lg hover:bg-[#081B1B]/50" onClick={() => setIsSidebarOpen(true)}>
                <Menu className="h-5 w-5 text-[#EEE8B2]" />
             </button>
             <div>
              <h2 className="text-sm font-semibold tracking-tight text-[#EEE8B2]">Aether Assistant</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#96CDB0] animate-pulse shadow-[0_0_5px_#96CDB0]"></span>
                <span className="text-[9px] text-[#96CDB0] font-bold uppercase tracking-widest hidden sm:inline-block">Neural Mesh Active</span>
              </div>
             </div>
          </div>
          <div className="flex items-center gap-2 text-[#EEE8B2]">
            <button className="p-2 rounded-lg hover:bg-[#081B1B]/50 transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
            <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#C18D52]/20 bg-[#081B1B]/40 hover:bg-[#081B1B]/60 text-xs font-semibold transition-colors">
              <Command className="h-3 w-3" />
              <span>Context Menu</span>
            </button>
          </div>
        </header>

        <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 space-y-8 messages-scroll-area custom-scrollbar scroll-smooth">
          <div className="w-full max-w-3xl mx-auto space-y-8 pb-12">
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-row items-end gap-2 w-full mb-4 ${msg.role === "assistant" ? "justify-start pr-20" : "justify-end pl-20"}`}
                >
                  <div className="w-9 h-9 min-w-[36px] flex-shrink-0 flex-grow-0 rounded-full bg-[#242F48] flex items-center justify-center shadow-lg">
                    {msg.role === "assistant" ? <Bot className="mx-auto h-5 w-5 text-[#FFA586]" /> : <User className="mx-auto h-5 w-5 text-[#E8E0F0]" />}
                  </div>
                  <div className={`flex flex-col max-w-[70%] w-fit ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    {msg.role === "assistant" && <span className="mb-1 ml-1 text-[#5A8F76] text-[10px] font-bold uppercase tracking-widest">AETHER</span>}
                    <div id={`msg-${msg.id}`} className="flex flex-col gap-2 max-w-full w-fit transition-all duration-300">
                      {msg.role === "user" && msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-col gap-2 mb-1">
                          {msg.attachments.map((file, i) => (
                            <FileAttachmentCard key={i} name={file.name} type={file.type} size={file.size} previewUrl={file.previewUrl} isDarkMode={false} />
                          ))}
                        </div>
                      )}
                      <div className={`break-words overflow-wrap-anywhere whitespace-pre-wrap ${msg.role === "assistant" ? "bg-white text-[#081B1B] text-[0.95rem] leading-relaxed px-4 py-3 rounded-[4px_18px_18px_18px] border border-[rgba(90,143,118,0.2)] shadow-sm" : "bg-gradient-to-br from-[#C18D52] to-[#D4A96A] text-[#081B1B] font-medium text-[0.95rem] leading-relaxed px-4 py-2.5 rounded-[18px_4px_18px_18px] shadow-sm ml-auto"}`}>
                        {msg.role === "assistant" ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ table: ({node, ...props}) => (<div className="w-full max-w-full overflow-x-auto"><table className="w-full min-w-[unset]" {...props} /></div>) }}>
                            {msg.content || (msg.role === "assistant" && (!isStreaming || index < messages.length - 1) ? "I encountered an issue generating a response. Please try again." : "")}
                          </ReactMarkdown>
                        ) : msg.content}
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-2 mt-2 ${msg.role === "assistant" ? "ml-1" : "mr-1"} transition-opacity opacity-70 hover:opacity-100`}>
                      <span className="text-[10px] text-[#5A8F76] font-mono uppercase tracking-tighter">
                        {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.role === "user" && <span className="text-[#96CDB0] text-[10px]">✓✓</span>}
                      {msg.role === "assistant" && msg.id !== "initial-1" && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleCopy(msg.id, msg.content)} className="p-1.5 rounded hover:bg-[#EEE8B2]/50 text-[#5A8F76] transition-all duration-200">
                            {copiedId === msg.id ? <Check className="h-3.5 w-3.5 text-[#C18D52]" /> : <Copy className="h-3.5 w-3.5 hover:text-[#C18D52]" />}
                          </button>
                          <button onClick={() => handleFeedback(msg.id, "positive")} className={`p-1.5 rounded hover:bg-[#EEE8B2]/50 transition-all duration-200 ${msg.feedback === "positive" ? "text-[#C18D52]" : "text-[#5A8F76]"}`}>
                            <ThumbsUp className={`h-3.5 w-3.5 hover:text-[#C18D52] ${msg.feedback === "positive" ? "fill-[#C18D52]" : ""}`} />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><button className="p-1.5 rounded hover:bg-[#EEE8B2]/50 text-[#5A8F76] transition-all duration-200"><Download className="h-3.5 w-3.5 hover:text-[#C18D52]" /></button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-[#081B1B] border-[#5A8F76]/30 text-[#EEE8B2]">
                              <span className="text-xs font-semibold px-2 py-1.5 text-[#5A8F76]">Export Options</span>
                              <DropdownMenuSeparator className="bg-[#5A8F76]/20" />
                              <DropdownMenuItem onClick={() => downloadAsPDF(`msg-${msg.id}`, `AetherAI_Response_${new Date().toISOString().split('T')[0]}.pdf`)} className="text-sm cursor-pointer hover:bg-[#5A8F76]/20 focus:bg-[#5A8F76]/20"><FileText className="mr-2 h-4 w-4 text-[#C18D52]" />Download as PDF</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => downloadAsText(msg.content, `AetherAI_Response_${new Date().toISOString().split('T')[0]}.txt`)} className="text-sm cursor-pointer hover:bg-[#5A8F76]/20 focus:bg-[#5A8F76]/20"><FileCode className="mr-2 h-4 w-4 text-[#96CDB0]" />Download as TXT</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => downloadAsImage(`msg-${msg.id}`, `AetherAI_Image_${new Date().toISOString().split('T')[0]}.png`)} className="text-sm cursor-pointer hover:bg-[#5A8F76]/20 focus:bg-[#5A8F76]/20"><Image className="mr-2 h-4 w-4 text-[#FFA586]" />Download as Image</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <button onClick={() => handleFeedback(msg.id, "negative")} className={`p-1.5 rounded hover:bg-[#EEE8B2]/50 transition-all duration-200 ${msg.feedback === "negative" ? "text-[#C18D52]" : "text-[#5A8F76]"}`}><ThumbsDown className={`h-3.5 w-3.5 hover:text-[#C18D52] ${msg.feedback === "negative" ? "fill-[#C18D52]" : ""}`} /></button>
                          {index === messages.length - 1 && (<button onClick={() => handleRegenerate(msg.content)} className="p-1.5 rounded hover:bg-[#EEE8B2]/50 text-[#5A8F76] transition-all duration-200 group relative"><RefreshCw className="h-3.5 w-3.5 hover:text-[#C18D52] group-active:animate-spin" /></button>)}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isStreaming && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-row justify-start items-end gap-2 w-full mb-4 pr-20">
                <div className="w-9 h-9 min-w-[36px] flex-shrink-0 flex-grow-0 rounded-full bg-[#242F48] flex items-center justify-center shadow-lg"><Bot className="h-5 w-5 text-[#FFA586]" /></div>
                <div className="flex flex-col max-w-[70%] w-fit mr-auto">
                  {currentAgent ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EEE8B2] border border-[#C18D52]/20 text-[11px] font-bold text-[#5A8F76] uppercase tracking-widest italic animate-pulse"><span className="h-2 w-2 bg-[#C18D52] rounded-full animate-pulse mr-1"></span>Aether is processing...</div>
                      <div className="flex items-center gap-1.5 px-5 py-3.5 rounded-2xl rounded-tl-none bg-white border border-[#5A8F76]/20 shadow-sm w-fit"><span className="h-1.5 w-1.5 bg-[#C18D52] rounded-full animate-bounce [animation-delay:-0.3s]"></span><span className="h-1.5 w-1.5 bg-[#C18D52] rounded-full animate-bounce [animation-delay:-0.15s]"></span><span className="h-1.5 w-1.5 bg-[#C18D52] rounded-full animate-bounce"></span></div>
                    </div>
                  ) : (
                    <div className="max-w-full w-fit break-words overflow-wrap-anywhere whitespace-pre-wrap overflow-hidden bg-white text-[#081B1B] text-[0.95rem] leading-relaxed px-4 py-3 rounded-[4px_18px_18px_18px] border border-[rgba(90,143,118,0.2)] shadow-sm font-medium bot-bubble">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ table: ({node, ...props}) => (<div className="w-full max-w-full overflow-x-auto"><table className="w-full min-w-[unset]" {...props} /></div>) }}>
                        {displayedStreamingMessage || (isStreaming ? "Aether is thinking..." : "")}
                      </ReactMarkdown>
                      <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="inline-block w-1.5 h-4 bg-[#C18D52] align-middle ml-1" />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} className="h-px w-full" />
          </div>
        </div>

        <div className="flex-shrink-0 p-4 md:p-8 border-t border-[#C18D52]/20 z-10 w-full relative bg-[#EEE8B2]/50">
          <div className="max-w-3xl mx-auto relative group">
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 px-2">
                <AnimatePresence>
                  {selectedFiles.map(file => (
                    <motion.div key={file.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <FileAttachmentCard name={file.file.name} type={file.file.type} size={file.file.size} previewUrl={file.previewUrl} onRemove={() => removeFile(file.id)} isDarkMode={true} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            <div className="relative flex items-center bg-white border border-[#5A8F76]/30 rounded-[24px] shadow-sm transition-all pl-2 pr-2 py-2 group-focus-within:border-[#C18D52] group-focus-within:ring-4 group-focus-within:ring-[#C18D52]/15">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple className="hidden" accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,application/json,text/javascript,text/typescript,text/x-python" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-[42px] w-[42px] shrink-0 rounded-full flex items-center justify-center transition-all duration-200 text-[#5A8F76] hover:bg-[#5A8F76]/10 hover:text-[#C18D52]"><Paperclip className="h-5 w-5" /></button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={12} className="w-56 bg-white border-[#5A8F76]/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-[#081B1B] rounded-xl p-2 z-[100]">
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer font-medium py-2.5 rounded-lg hover:bg-[#5A8F76]/10 focus:bg-[#5A8F76]/10 mb-1"><HardDrive className="mr-3 h-4 w-4 text-[#5A8F76]" />Upload files</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer font-medium py-2.5 rounded-lg hover:bg-[#5A8F76]/10 focus:bg-[#5A8F76]/10 mb-1"><Image className="mr-3 h-4 w-4 text-[#C18D52]" />Photos</DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer font-medium py-2.5 rounded-lg hover:bg-[#5A8F76]/10 focus:bg-[#5A8F76]/10"><CodeIcon className="mr-3 h-4 w-4 text-[#96CDB0]" />Import code</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <input
                  ref={inputRef}
                  id="chat-input"
                  name="chat-input"
                  type="text"
                  placeholder={isStreaming ? (isPaused ? "Aether is paused..." : "Aether is thinking...") : "Write a message..."}
                  className="flex-1 bg-transparent border-none focus:outline-none text-[15px] font-medium py-3 text-[#081B1B] placeholder:text-[#5A8F76] placeholder:italic disabled:opacity-50"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  disabled={isStreaming}
                />
                
                <div className="flex items-center gap-2">
                  {isStreaming && (
                    <button onClick={togglePause} className="h-[42px] w-[42px] shrink-0 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg bg-[#5A8F76] text-white hover:bg-[#C18D52]/80" title={isPaused ? "Resume" : "Pause"}>
                      {isPaused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4 fill-current" />}
                    </button>
                  )}
                  <button 
                    onClick={isStreaming ? handleStop : () => sendMessage(input)}
                    disabled={(isStreaming && !isStreaming) || (!isStreaming && !input.trim())}
                    className={`h-[42px] w-[42px] shrink-0 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg group/btn ${isStreaming ? "bg-[#B51A2B] text-white hover:bg-red-700" : "bg-gradient-to-br from-[#203B37] to-[#081B1B] text-[#C18D52] hover:from-[#C18D52] hover:to-[#EEE8B2] hover:text-[#081B1B] hover:shadow-[0_4px_16px_rgba(193,141,82,0.4)] hover:scale-105 active:scale-95 disabled:opacity-50"}`}
                    title={isStreaming ? "Stop" : "Send"}
                  >
                    {isStreaming ? <Square className="h-4 w-4 fill-current" /> : <Send className="h-5 w-5 ml-0.5" />}
                  </button>
                </div>
            </div>
            <p className="text-[10px] text-center mt-3 text-[#5A8F76] font-medium hidden sm:block uppercase tracking-widest">System Interface Active • Aether AI Core V4.2.0</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;

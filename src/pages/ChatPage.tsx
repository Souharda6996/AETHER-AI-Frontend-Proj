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
  Share2, Sparkles, Command, ArrowLeft, Square, Copy, Check, 
  ThumbsUp, ThumbsDown, RefreshCw, Menu, X, Pause, Play
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: any;
  feedback?: "positive" | "negative" | null;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: any;
  createdAt: any;
}

const API_KEY = import.meta.env.VITE_API_KEY || "[PASTE YOUR KEY HERE]";
const BACKEND_URL = "http://localhost:8000/api/v1";

if (!API_KEY || API_KEY === "[PASTE YOUR GROQ API KEY HERE]" || API_KEY === "[PASTE YOUR KEY HERE]") {
  console.error("API KEY IS MISSING!");
}

const sanitizeContent = (content: string) => {
  if (!content) return "";
  return content.replace(/<br\s*\/?>/gi, "\n");
};

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

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages, displayedStreamingMessage]); // triggers on new messages or typewriter updates

  // Also scroll to bottom on initial load
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
      if (!snapshot.empty) {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
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

  // Slow Typewriter Effect for Bot Responses
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
        // Force a slower, more deliberate pace (approx 30ms per char)
        setDisplayedStreamingMessage(streamingMessage.slice(0, displayedStreamingMessage.length + 1));
      }, 30);
      return () => clearTimeout(timeout);
    } else if (displayedStreamingMessage.length === streamingMessage.length && streamingMessage.length > 0) {
      // Animation finished - finalize the message
      const finalizeMessage = async () => {
        const reply = streamingMessage;
        
        // 1. Persist to Firestore (this will trigger the onSnapshot)
        if (currentUser && activeConversationId) {
          try {
            await addDoc(collection(db, "users", currentUser.uid, "conversations", activeConversationId, "messages"), {
              role: "assistant",
              content: reply,
              timestamp: serverTimestamp()
            });
            console.log('✅ AI response finalized and saved to journal');
          } catch (error) {
            console.error('Error finalizing message:', error);
          }
        }
        
        // 2. Clean up streaming states ONLY after a short delay to let Firestore sync
        // OR add to local state immediately to avoid flicker
        setMessages(prev => [...prev, {
           id: crypto.randomUUID(),
           role: 'assistant',
           content: reply,
           timestamp: new Date()
        }]);

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
    const trimmed = inputText.trim()
    if (!trimmed || isStreaming) return

    // 1. Add user message immediately
    let convId = activeConversationId;
    
    if (!convId && currentUser) {
      const convRef = await addDoc(collection(db, "users", currentUser.uid, "conversations"), {
        title: trimmed.slice(0, 40) + (trimmed.length > 40 ? "..." : ""),
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

    const userMsg = {
      id:        crypto.randomUUID(),
      role:      'user' as const,
      content:   trimmed,
      timestamp: new Date().toISOString(),
    }
    
    // We add to local state immediately for fast feedback
    setMessages(prev => [...prev, userMsg])
    
    if (currentUser && convId) {
      await addDoc(collection(db, "users", currentUser.uid, "conversations", convId, "messages"), {
        role: "user",
        content: trimmed,
        timestamp: serverTimestamp()
      });
    }

    setInput('')
    setIsStreaming(true)

    try {
      // 2. Use relative path for Vercel Serverless Functions
      // When deployed, frontend and backend share the same base URL
      const API_ENDPOINT = '/api/chat'

      // 3. Build full conversation history
      const history = [...messages.filter(m => m.id !== "initial-1"), userMsg].map(m => ({
        role:    m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }))

      // 4. Call the API
      const controller = new AbortController();
      setAbortController(controller);

      const res = await fetch(API_ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  controller.signal,
        body:    JSON.stringify({ 
          message:  trimmed,
          messages: history 
        }),
      })

      // 5. Always parse as text first (catches non-JSON responses)
      const rawText = await res.text()
      
      let data: any
      try {
        data = JSON.parse(rawText)
      } catch {
        console.error('Non-JSON response:', rawText.substring(0, 500))
        throw new Error('Server returned an invalid response')
      }

      // 6. Handle HTTP errors with specific messages
      if (!res.ok) {
        const errDetail = data?.error ?? `Server error ${res.status}`
        console.error('API error response:', res.status, data)
        throw new Error(errDetail)
      }

      // 7. Extract reply — check all possible field names
      const reply: string = 
        data?.reply    ?? 
        data?.content  ?? 
        data?.message  ?? 
        data?.text     ?? 
        data?.response ?? 
        ''

      if (!reply.trim()) {
        console.error('Empty reply from server. Data was:', data)
        throw new Error('Received empty response from AI')
      }

      // 8. Initiate Typewriter Pipeline
      setStreamingMessage(reply);
      setDisplayedStreamingMessage("");
      // Note: isStreaming is already true, and will be set to false by the useEffect once typing is done.
      
      console.log('📡 AI response received, starting typewriter effect...')

    } catch (err: any) {
      console.error('❌ sendMessage failed:', err?.message)
      
      // Show SPECIFIC error message, not generic one
      const errorContent = err?.message?.includes('API key') 
                   ? 'Configuration error: API key missing. Please check environment settings.'
                   : err?.message?.includes('rate limit')
                   ? 'Too many requests. Please wait a moment.'
                   : err?.message?.includes('network') ||
                     err?.message?.includes('fetch')
                   ? 'Network error. Check your connection.'
                   : `Error: ${err?.message ?? 'Unknown error'}`;

      setMessages(prev => [...prev, {
        id:        crypto.randomUUID(),
        role:      'assistant' as const,
        content:   errorContent,
        timestamp: new Date().toISOString(),
      }])
      setIsStreaming(false); // Reset on error
    } finally {
      // isStreaming is handled either by catch or by typewriter useEffect
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
    // ── LEVEL 1: Full screen wrapper ──
    <div className="fixed inset-0 flex overflow-hidden bg-[#081B1B] text-[#EEE8B2] font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── LEVEL 2A: Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 md:relative flex flex-col flex-shrink-0 h-full border-r border-[#5A8F76]/30 bg-[#081B1B] p-4 transform transition-transform duration-300 sidebar-gradient overflow-y-auto overflow-x-hidden ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex items-center justify-between px-2 mb-8 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2 group">
            <ArrowLeft className="h-4 w-4 text-[#5A8F76] group-hover:text-[#C18D52] transition-colors" />
            <div className="flex items-center gap-2">
              <img src="/aether-logo.png" alt="Aether AI" className="h-7 w-7 rounded-lg shadow-[0_0_15px_rgba(193,141,82,0.3)] animate-pulse" />
              <span className="font-display text-xl tracking-tight text-[#C18D52]">AETHER</span>
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
            <X className="h-5 w-5 text-[#5A8F76]" />
          </button>
        </div>

        <button 
          onClick={resetChat}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#C18D52]/10 to-transparent border border-[#C18D52]/20 text-[#C18D52] hover:from-[#C18D52]/20 transition-all duration-300 mb-6 group flex-shrink-0"
        >
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

      {/* ── LEVEL 2B: Main chat column ── */}
      <main className="flex flex-col flex-1 h-full min-h-0 overflow-hidden relative bg-[#F5F2E0]" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(90, 143, 118, 0.04) 39px, rgba(90, 143, 118, 0.04) 40px)`,
        border: '1px solid rgba(193, 141, 82, 0.3)',
        boxShadow: `0 16px 48px rgba(8, 27, 27, 0.35), 0 0 0 1px rgba(193, 141, 82, 0.1) inset`
      }}>
        {/* ── LEVEL 3A: Top header bar ── */}
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

        {/* ── LEVEL 3B: Messages scroll area ── */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 space-y-8 messages-scroll-area custom-scrollbar scroll-smooth"
        >
          <div className="w-full max-w-3xl mx-auto space-y-8 pb-12">
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-row items-end gap-2 w-full mb-4 ${msg.role === "assistant" ? "justify-start pr-20" : "justify-end pl-20"}`}
                >
                  <div className={`w-9 h-9 min-w-[36px] flex-shrink-0 flex-grow-0 rounded-full bg-[#242F48] flex items-center justify-center shadow-lg`}>
                    {msg.role === "assistant" ? <Bot className="mx-auto h-5 w-5 text-[#FFA586]" /> : <User className="mx-auto h-5 w-5 text-[#E8E0F0]" />}
                  </div>
                  <div className={`flex flex-col max-w-[70%] w-fit ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    {msg.role === "assistant" && (
                      <span className="mb-1 ml-1 text-[#5A8F76] text-[10px] font-bold uppercase tracking-widest">AETHER</span>
                    )}
                    <div className={`max-w-full w-fit break-words overflow-wrap-anywhere whitespace-pre-wrap transition-all duration-300 ${
                      msg.role === "assistant"
                        ? "overflow-hidden bg-white text-[#081B1B] text-[0.95rem] leading-relaxed px-4 py-3 rounded-[4px_18px_18px_18px] border border-[rgba(90,143,118,0.2)] shadow-sm"
                        : "bg-gradient-to-br from-[#C18D52] to-[#D4A96A] text-[#081B1B] font-medium text-[0.95rem] leading-relaxed px-4 py-2.5 rounded-[18px_4px_18px_18px]"
                    }`}>
                      {msg.role === "assistant" ? (
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({node, ...props}) => (
                              <div className="w-full max-w-full overflow-x-auto">
                                <table className="w-full min-w-[unset]" {...props} />
                              </div>
                            )
                          }}
                        >
                          {msg.content || (msg.role === "assistant" && (!isStreaming || index < messages.length - 1) ? "I encountered an issue generating a response. Please try again." : "")}
                        </ReactMarkdown>
                      ) : (
                        msg.content
                      )}
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
                          <button onClick={() => handleFeedback(msg.id, "negative")} className={`p-1.5 rounded hover:bg-[#EEE8B2]/50 transition-all duration-200 ${msg.feedback === "negative" ? "text-[#C18D52]" : "text-[#5A8F76]"}`}>
                            <ThumbsDown className={`h-3.5 w-3.5 hover:text-[#C18D52] ${msg.feedback === "negative" ? "fill-[#C18D52]" : ""}`} />
                          </button>
                          {index === messages.length - 1 && (
                            <button onClick={() => handleRegenerate(msg.content)} className="p-1.5 rounded hover:bg-[#EEE8B2]/50 text-[#5A8F76] transition-all duration-200 group relative">
                              <RefreshCw className="h-3.5 w-3.5 hover:text-[#C18D52] group-active:animate-spin" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isStreaming && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-row justify-start items-end gap-2 w-full mb-4 pr-20"
              >
                <div className="w-9 h-9 min-w-[36px] flex-shrink-0 flex-grow-0 rounded-full bg-[#242F48] flex items-center justify-center shadow-lg">
                  <Bot className="h-5 w-5 text-[#FFA586]" />
                </div>
                <div className="flex flex-col max-w-[70%] w-fit mr-auto">
                  {currentAgent ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EEE8B2] border border-[#C18D52]/20 text-[11px] font-bold text-[#5A8F76] uppercase tracking-widest italic animate-pulse">
                        <span className="h-2 w-2 bg-[#C18D52] rounded-full animate-pulse mr-1"></span>
                        Aether is processing...
                      </div>
                      <div className="flex items-center gap-1.5 px-5 py-3.5 rounded-2xl rounded-tl-none bg-white border border-[#5A8F76]/20 shadow-sm w-fit">
                        <span className="h-1.5 w-1.5 bg-[#C18D52] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-1.5 w-1.5 bg-[#C18D52] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-1.5 w-1.5 bg-[#C18D52] rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-full w-fit break-words overflow-wrap-anywhere whitespace-pre-wrap overflow-hidden bg-white text-[#081B1B] text-[0.95rem] leading-relaxed px-4 py-3 rounded-[4px_18px_18px_18px] border border-[rgba(90,143,118,0.2)] shadow-sm font-medium overflow-x-auto custom-markdown bot-bubble">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({node, ...props}) => (
                            <div className="w-full max-w-full overflow-x-auto">
                              <table className="w-full min-w-[unset]" {...props} />
                            </div>
                          )
                        }}
                      >
                        {displayedStreamingMessage || (currentAgent ? "Aether is processing..." : isStreaming ? "Aether is thinking..." : "")}
                      </ReactMarkdown>
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        className="inline-block w-1.5 h-4 bg-[#C18D52] align-middle ml-1"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            {/* Invisible scroll anchor */}
            <div ref={messagesEndRef} className="h-px w-full" />
          </div>
        </div>

        {/* ── LEVEL 3C: Input bar ── */}
        <div className="flex-shrink-0 p-4 md:p-8 border-t border-[#C18D52]/20 z-10 w-full relative bg-[#EEE8B2]/50">
          <div className="max-w-3xl mx-auto relative group">
            <div className={`relative flex items-center bg-white border border-[#5A8F76]/30 rounded-[24px] shadow-sm transition-all pl-4 pr-2 py-2 group-focus-within:border-[#C18D52] group-focus-within:ring-4 group-focus-within:ring-[#C18D52]/15 ${isStreaming ? '' : ''}`}>
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
                    <button 
                      onClick={togglePause}
                      className="h-[42px] w-[42px] shrink-0 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg bg-[#5A8F76] text-white hover:bg-[#C18D52]/80"
                      title={isPaused ? "Resume" : "Pause"}
                    >
                      {isPaused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4 fill-current" />}
                    </button>
                  )}
                  <button 
                    onClick={isStreaming ? handleStop : () => sendMessage(input)}
                    disabled={(isStreaming && !isStreaming) || (!isStreaming && !input.trim())}
                    className={`h-[42px] w-[42px] shrink-0 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg group/btn ${
                      isStreaming 
                        ? "bg-[#B51A2B] text-white hover:bg-red-700" 
                        : "bg-gradient-to-br from-[#203B37] to-[#081B1B] text-[#C18D52] hover:from-[#C18D52] hover:to-[#EEE8B2] hover:text-[#081B1B] hover:shadow-[0_4px_16px_rgba(193,141,82,0.4)] hover:scale-105 active:scale-95 disabled:opacity-50"
                    }`}
                    title={isStreaming ? "Stop" : "Send"}
                  >
                    {isStreaming ? <Square className="h-4 w-4 fill-current" /> : <Send className="h-5 w-5 ml-0.5" />}
                  </button>
                </div>
            </div>
            <p className="text-[10px] text-center mt-3 text-[#5A8F76] font-medium hidden sm:block uppercase tracking-widest">
              System Interface Active • Aether AI Core V4.2.0
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;

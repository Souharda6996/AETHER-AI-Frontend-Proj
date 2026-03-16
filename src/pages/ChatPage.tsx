import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../custom-markdown.css";
import { 
  Send, Bot, User, Plus, MessageSquare, Settings, LogOut, 
  Share2, Sparkles, Command, ArrowLeft, Square, Copy, Check, 
  ThumbsUp, ThumbsDown, RefreshCw, Menu, X
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { 
  collection, query, orderBy, onSnapshot, addDoc, 
  serverTimestamp, updateDoc, doc 
} from "firebase/firestore";

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

const API_KEY = import.meta.env.VITE_API_KEY || "[PASTE YOUR GROQ API KEY HERE]";

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
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  
  // Streaming states
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // DB & History states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // UI states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingMessage, isStreaming, currentAgent]);

  // Load sidebar conversations
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

  // Load currently active conversation messages
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

  const streamResponse = async (userMsgText: string, updatedHistory: {role: string, content: string}[], convId: string) => {
    setIsStreaming(true);
    setCurrentAgent("reasoning");
    setStreamingMessage("");
    
    const controller = new AbortController();
    setAbortController(controller);
    let fullText = "";
    
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: updatedHistory,
          stream: true
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Neural link failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.trim().startsWith("data: ")) {
            const dataStr = line.trim().slice(6);
            if (dataStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.choices?.[0]?.delta?.content) {
                fullText += parsed.choices[0].delta.content;
                setStreamingMessage(fullText);
                setCurrentAgent(null); // Clear loading indicator when text arrives
              }
            } catch (e) {
              // Ignore invalid JSON chunks gracefully
            }
          }
        }
      }

      // Finalize Message
      if (currentUser) {
        const botMessage = {
          role: "assistant",
          content: fullText,
          timestamp: serverTimestamp()
        };
        await addDoc(collection(db, "users", currentUser.uid, "conversations", convId, "messages"), botMessage);
      }
      
    } catch (error: any) {
      if (currentUser) {
        if (error.name === 'AbortError') {
          const botMessage = {
            role: "assistant",
            content: fullText + (fullText ? "\n\n" : "") + "*(Intelligence operation terminated by user)*",
            timestamp: serverTimestamp()
          };
          await addDoc(collection(db, "users", currentUser.uid, "conversations", convId, "messages"), botMessage);
        } else {
          console.error("Full Neural Sync Error:", error);
          toast.error("Neural synchronization interrupted.");
          const errorMessage = {
            role: "assistant",
            content: fullText + `\n\n**CRITICAL ERROR**: ${error.message}\n\nPlease ensure your API Key is correctly configured in the environment settings.`,
            timestamp: serverTimestamp()
          };
          await addDoc(collection(db, "users", currentUser.uid, "conversations", convId, "messages"), errorMessage);
        }
      }
    } finally {
      setIsStreaming(false);
      setStreamingMessage("");
      setCurrentAgent(null);
      setAbortController(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !currentUser) return;

    const userMsgText = input;
    setInput("");

    let convId = activeConversationId;
    
    if (!convId) {
      const convRef = await addDoc(collection(db, "users", currentUser.uid, "conversations"), {
        title: userMsgText.slice(0, 40) + "...",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      convId = convRef.id;
      setActiveConversationId(convId);
      
      // Since it's a new conversation, local messages array is just the current new user message.
      setMessages([{ id: "temp-user", role: "user", content: userMsgText, timestamp: new Date() }]);
    } else {
      await updateDoc(doc(db, "users", currentUser.uid, "conversations", convId), {
        updatedAt: serverTimestamp()
      });
    }

    const apiHistory = messages
      .filter(m => m.id !== "initial-1" && !m.content.includes("**CRITICAL ERROR**"))
      .map(m => ({ role: m.role, content: m.content }));
    apiHistory.push({ role: "user", content: userMsgText });

    await addDoc(collection(db, "users", currentUser.uid, "conversations", convId, "messages"), {
      role: "user",
      content: userMsgText,
      timestamp: serverTimestamp()
    });

    await streamResponse(userMsgText, apiHistory, convId);
  };

  const handleRegenerate = async (msgContent: string) => {
    if (!currentUser || !activeConversationId || isStreaming) return;
    const lastUserMsg = messages.slice().reverse().find(m => m.role === "user");
    if (lastUserMsg) {
      const apiHistory = messages
        .filter(m => m.id !== "initial-1" && !m.content.includes("**CRITICAL ERROR**"))
        .map(m => ({ role: m.role, content: m.content }));
      
      await updateDoc(doc(db, "users", currentUser.uid, "conversations", activeConversationId), {
        updatedAt: serverTimestamp()
      });
      
      await streamResponse(lastUserMsg.content, apiHistory, activeConversationId);
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
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#050508] text-foreground font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 md:relative flex flex-col border-r border-[#1a1a2e] bg-[#0a0a14] p-4 transform transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex items-center justify-between px-2 mb-8">
          <Link to="/" className="flex items-center gap-2 group">
            <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              <span className="font-display text-xl tracking-tight">AETHER</span>
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <button 
          onClick={resetChat}
          className="flex items-center gap-2 w-full p-3 rounded-xl border border-[#1a1a2e] bg-[#0f0f1c] hover:bg-[#16162a] transition-all mb-6 text-sm font-medium"
        >
          <Plus className="h-4 w-4 text-primary" />
          New intelligence thread
        </button>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-2 mb-2">Recent Threads</p>
          {conversations.map((conv) => (
            <button 
              key={conv.id} 
              onClick={() => {
                setActiveConversationId(conv.id);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors text-sm text-left ${activeConversationId === conv.id ? 'bg-[#1a1a2e] border border-primary/20 text-primary font-medium' : 'hover:bg-[#1a1a2e] text-muted-foreground'}`}
            >
              <MessageSquare className="h-4 w-4 opacity-50 shrink-0" />
              <span className="truncate">{conv.title}</span>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="text-xs text-muted-foreground/50 px-2 italic">No clear threads found in database.</p>
          )}
        </div>

        <div className="pt-4 border-t border-[#1a1a2e] space-y-2 mt-2">
          <button className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-[#1a1a2e] transition-colors text-sm font-medium">
            <Settings className="h-4 w-4 opacity-70" />
            Neural Settings
          </button>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0f0f1c] border border-[#1a1a2e]">
            <div className="flex items-center gap-3 overflow-hidden">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="h-8 w-8 rounded-lg" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-black shadow-lg">
                  {(currentUser?.displayName || currentUser?.email || "OP").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col overflow-hidden">
                <span className="text-[11px] font-semibold truncate leading-none text-foreground/90">{currentUser?.displayName || currentUser?.email?.split('@')[0]}</span>
                <span className="text-[9px] text-primary tracking-tighter uppercase font-bold mt-1">Authorized Profile</span>
              </div>
            </div>
            <button onClick={async () => { await logout(); navigate('/login'); }} title="Sign Out">
              <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors cursor-pointer" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-[#050508]">
        {/* Header */}
        <header className="h-16 border-b border-[#1a1a2e] flex items-center justify-between px-4 md:px-6 bg-[#0a0a14]/50 backdrop-blur-md z-10 w-full">
          <div className="flex items-center gap-3">
             <button className="md:hidden p-2 rounded-lg hover:bg-[#1a1a2e]" onClick={() => setIsSidebarOpen(true)}>
               <Menu className="h-5 w-5 text-muted-foreground" />
             </button>
             <div>
              <h2 className="text-sm font-semibold tracking-tight">Main Intelligence Terminal</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></span>
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest hidden sm:inline-block">Neural Mesh Core V4.2</span>
              </div>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-[#1a1a2e] transition-colors text-muted-foreground">
              <Share2 className="h-4 w-4" />
            </button>
            <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1a1a2e] bg-[#0f0f1c] hover:bg-[#16162a] text-xs font-semibold transition-colors">
              <Command className="h-3 w-3" />
              <span>Export Core</span>
            </button>
          </div>
        </header>

        {/* Message View */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 space-y-8 custom-scrollbar scroll-smooth"
        >
          <div className="max-w-3xl mx-auto space-y-8 pb-12">
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.role === "assistant" ? "" : "flex-row-reverse"}`}
                >
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                    msg.role === "assistant" 
                      ? "bg-primary/20 text-primary border border-primary/20" 
                      : "bg-[#1a1a2e] text-foreground border border-white/5"
                  }`}>
                    {msg.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </div>
                  <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${msg.role === "assistant" ? "" : "items-end"}`}>
                    <div className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap word-break break-words custom-markdown ${
                      msg.role === "assistant"
                        ? "bg-[#0f0f1c] border border-[#1a1a2e] text-foreground/90 font-medium"
                        : "bg-primary text-primary-foreground font-semibold shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                    }`}>
                      {msg.role === "assistant" ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        msg.content
                      )}
                    </div>
                    
                    {/* Message Actions / Timestamp */}
                    <div className={`flex items-center gap-2 mt-2 ${msg.role === "assistant" ? "ml-1" : "mr-1"} transition-opacity opacity-70 hover:opacity-100`}>
                      <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                        {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      
                      {msg.role === "assistant" && msg.id !== "initial-1" && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleCopy(msg.id, msg.content)} className="p-1.5 rounded hover:bg-[#1a1a2e] text-muted-foreground transition-all duration-200">
                            {copiedId === msg.id ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5 hover:text-primary" />}
                          </button>
                          <button onClick={() => handleFeedback(msg.id, "positive")} className={`p-1.5 rounded hover:bg-[#1a1a2e] transition-all duration-200 ${msg.feedback === "positive" ? "text-primary" : "text-muted-foreground"}`}>
                            <ThumbsUp className={`h-3.5 w-3.5 hover:text-primary ${msg.feedback === "positive" ? "fill-primary" : ""}`} />
                          </button>
                          <button onClick={() => handleFeedback(msg.id, "negative")} className={`p-1.5 rounded hover:bg-[#1a1a2e] transition-all duration-200 ${msg.feedback === "negative" ? "text-primary" : "text-muted-foreground"}`}>
                            <ThumbsDown className={`h-3.5 w-3.5 hover:text-primary ${msg.feedback === "negative" ? "fill-primary" : ""}`} />
                          </button>
                          {index === messages.length - 1 && (
                            <button onClick={() => handleRegenerate(msg.content)} className="p-1.5 rounded hover:bg-[#1a1a2e] text-muted-foreground transition-all duration-200 group relative">
                              <RefreshCw className="h-3.5 w-3.5 hover:text-primary group-active:animate-spin" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Streaming UI Box */}
            {isStreaming && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="h-9 w-9 rounded-xl bg-primary/20 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-lg">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex flex-col max-w-[85%] sm:max-w-[75%]">
                  {currentAgent ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f0f1c] border border-primary/20 text-[11px] font-bold text-primary uppercase tracking-widest animate-pulse">
                        <Sparkles className="h-3 w-3" />
                        Aether is processing...
                      </div>
                      <div className="flex items-center gap-1.5 px-5 py-3.5 rounded-2xl bg-[#0f0f1c] border border-[#1a1a2e] w-fit">
                        <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap bg-[#0f0f1c] border border-[#1a1a2e] text-foreground/90 font-medium custom-markdown">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamingMessage}
                      </ReactMarkdown>
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        className="inline-block w-1.5 h-4 bg-primary align-middle shadow-[0_0_8px_#00e5ff] mt-1"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 pt-0 z-10 w-full relative">
          <div className="max-w-3xl mx-auto relative group">
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-2xl blur-md transition-opacity ${isStreaming ? 'opacity-0' : 'opacity-0 group-focus-within:opacity-100'}`}></div>
            <div className={`relative flex items-center bg-[#0f0f1c] border border-[#1a1a2e] rounded-2xl shadow-2xl transition-colors pl-4 pr-2 py-2 ${isStreaming ? '' : 'focus-within:border-primary/50'}`}>
              <input
                ref={inputRef}
                id="chat-input"
                name="chat-input"
                type="text"
                placeholder={isStreaming ? "Aether is thinking..." : "Synchronize with Aether neural network..."}
                className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium py-3 disabled:opacity-50"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={isStreaming}
              />
              <button 
                onClick={isStreaming ? handleStop : handleSend}
                disabled={(isStreaming && !abortController) || (!isStreaming && !input.trim())}
                className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                  isStreaming 
                    ? "bg-red-500 hover:bg-red-600 text-white hover:scale-105 active:scale-95" 
                    : "bg-primary text-primary-foreground disabled:opacity-50 disabled:grayscale hover:scale-105 active:scale-95"
                }`}
              >
                {isStreaming ? <Square className="h-4 w-4 fill-current" /> : <Send className="h-5 w-5 ml-0.5" />}
              </button>
            </div>
            <p className="text-[10px] text-center mt-3 text-muted-foreground/60 font-medium hidden sm:block">
              Aether AI Core V4.2.0 • Data isolated & encrypted • Neural synchronization active
            </p>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1a1a2e;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #00e5ff;
        }
      `}</style>
    </div>
  );
};

export default ChatPage;

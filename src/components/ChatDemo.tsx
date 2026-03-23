import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Zap } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "bot";
  text: string;
}

const sampleConversations: { trigger: string; response: string }[] = [
  { trigger: "What can you do?", response: "I can handle customer support, process orders, analyze sentiment, schedule meetings, search your knowledge base, and escalate complex issues to human agents — all autonomously with 47ms response time." },
  { trigger: "How fast are you?", response: "Our edge inference network delivers P95 latency of 47ms globally. That's faster than most humans can blink. Every response is streamed in real-time across 200+ edge nodes." },
  { trigger: "Is my data secure?", response: "Absolutely. We're SOC2 Type II certified with end-to-end encryption, RBAC, and full audit logging. Your data never leaves your VPC with our on-prem deployment option." },
  { trigger: "Show me analytics", response: "📊 Here's a quick snapshot:\n• Resolution rate: 94.2%\n• Avg response time: 43ms\n• Customer satisfaction: 4.8/5\n• Conversations today: 12,847\n\nAll metrics update in real-time on your dashboard." },
  { trigger: "Deploy to Slack", response: "One-click deployment ready! I'll integrate with your Slack workspace, sync channel history for context, and start handling queries immediately. No code changes needed — just authorize and go." },
];

const typingSpeed = 20;

const ChatDemo = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: "bot", text: "Hey! I'm Aether. Try asking me anything — click a suggestion or type your own message." },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [displayedBotText, setDisplayedBotText] = useState("");
  const [typingMessageId, setTypingMessageId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(1);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, displayedBotText]);

  const streamResponse = async (msg: string) => {
    setIsTyping(true);
    // Simulate initial network/processing delay showing the 3 dots
    await new Promise(resolve => setTimeout(resolve, 400));
    setIsTyping(false);

    const botId = idCounter.current++;
    setMessages((prev) => [...prev, { id: botId, role: "bot", text: "" }]);
    setTypingMessageId(botId);
    setDisplayedBotText("");

    const predefined = sampleConversations.find(c => c.trigger.toLowerCase() === msg.toLowerCase());
    const textToStream = predefined 
      ? predefined.response 
      : "I'm a demo representation of Aether. In the full product, I would use advanced dynamic reasoning to answer your query. Go to the Main Intelligence Terminal for full capabilities.";

    let currentText = "";
    // Speed up simulation to look like fast token streaming
    const words = textToStream.split(/(\s+)/);
    
    for (let i = 0; i < words.length; i++) {
        currentText += words[i];
        setDisplayedBotText(currentText);
        // Only delay on actual words, not spaces, to simulate token generation
        if (words[i].trim() !== "") {
            await new Promise(resolve => setTimeout(resolve, typingSpeed)); 
        }
    }

    setMessages((prev) => prev.map(m => m.id === botId ? { ...m, text: currentText } : m));
    setTypingMessageId(null);
  };

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping || typingMessageId !== null) return;

    const userMsg: Message = { id: idCounter.current++, role: "user", text: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    streamResponse(msg);
  };

  const suggestedPrompts = sampleConversations.slice(0, 3).map((c) => c.trigger);

  return (
    <section id="demo" className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16 perspective-container"
          initial={{ opacity: 0, rotateX: 60, y: 60 }}
          whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
        >
          <p className="text-primary font-mono-custom text-sm mb-4 tracking-wider uppercase">
            Live Demo
          </p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground">
            Try <span className="text-gradient">Aether</span> Now
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the speed and intelligence firsthand. This is a sample conversation—imagine it connected to your entire knowledge base.
          </p>
        </motion.div>

        <motion.div
          className="max-w-2xl mx-auto perspective-container"
          initial={{ opacity: 0, rotateX: 30, y: 60, scale: 0.9 }}
          whileInView={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
        >
          <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-muted flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-display text-foreground">Aether AI</p>
                <p className="text-xs text-primary font-mono-custom">● Online — 47ms</p>
              </div>
              <div className="ml-auto flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-muted" />
                <div className="w-3 h-3 rounded-full bg-muted" />
                <div className="w-3 h-3 rounded-full bg-primary/60" />
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="h-[400px] overflow-y-auto p-6 space-y-4 scrollbar-thin">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 200 }}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        msg.role === "bot" ? "bg-primary/20" : "bg-accent/20"
                      }`}
                    >
                      {msg.role === "bot" ? (
                        <Bot className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4 text-accent" />
                      )}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed ${
                        msg.role === "bot"
                          ? "bg-secondary text-foreground rounded-tl-md"
                          : "bg-primary/15 text-foreground rounded-tr-md"
                      }`}
                    >
                      <span className="whitespace-pre-wrap">
                        {typingMessageId === msg.id ? displayedBotText : msg.text}
                        {typingMessageId === msg.id && (
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle"
                          />
                        )}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-secondary rounded-2xl rounded-tl-md px-4 py-3 flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-muted-foreground"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Suggested prompts */}
            <div className="px-6 pb-2 flex gap-2 flex-wrap">
              {suggestedPrompts.map((prompt) => (
                <motion.button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={isTyping || typingMessageId !== null}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {prompt}
                </motion.button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-muted">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  disabled={isTyping || typingMessageId !== null}
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim() || isTyping || typingMessageId !== null}
                  className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ChatDemo;

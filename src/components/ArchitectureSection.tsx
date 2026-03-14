import { useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Database, Cpu, Cloud, Lock, Workflow, Globe } from "lucide-react";

const nodes = [
  { id: "input", label: "Input Layer", icon: Globe, description: "Multi-channel ingestion: REST, WebSocket, gRPC", connections: ["llm"], color: "191 91% 50%" },
  { id: "llm", label: "LLM Core", icon: Cpu, description: "Transformer-based reasoning with 128K context window", connections: ["memory", "tools"], color: "263 70% 50%" },
  { id: "memory", label: "Memory Store", icon: Database, description: "Vector DB with semantic search & conversation history", connections: ["output"], color: "191 91% 50%" },
  { id: "tools", label: "Tool Orchestrator", icon: Workflow, description: "Autonomous tool selection & execution pipeline", connections: ["security"], color: "263 70% 50%" },
  { id: "security", label: "Security Mesh", icon: Lock, description: "Zero-trust validation on every inference step", connections: ["output"], color: "191 91% 50%" },
  { id: "output", label: "Edge Delivery", icon: Cloud, description: "Global CDN with 47ms P95 latency", color: "263 70% 50%" },
];

const Card3D = ({ children, index }: { children: React.ReactNode; index: number }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-100, 100], [12, -12]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-12, 12]), { stiffness: 300, damping: 30 });
  const glareX = useTransform(x, [-100, 100], [0, 100]);
  const glareY = useTransform(y, [-100, 100], [0, 100]);

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, rotateX: 90, y: 80, z: -200 }}
      whileInView={{ opacity: 1, rotateX: 0, y: 0, z: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.12, type: "spring", damping: 18, stiffness: 80 }}
      style={{ perspective: 800 }}
    >
      <motion.div
        onMouseMove={handleMouse}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative"
      >
        {/* Glare overlay */}
        <motion.div
          className="absolute inset-0 rounded-[20px] pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: useTransform(
              [glareX, glareY],
              ([gx, gy]) =>
                `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.06) 0%, transparent 60%)`
            ),
          }}
        />
        {children}
      </motion.div>
    </motion.div>
  );
};

const ArchitectureSection = () => {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const getConnectedNodes = (nodeId: string): string[] => {
    const connected: string[] = [nodeId];
    nodes.forEach((n) => {
      if (n.id === nodeId && n.connections) connected.push(...n.connections);
      if (n.connections?.includes(nodeId)) connected.push(n.id);
    });
    return connected;
  };

  const highlightedNodes = activeNode ? getConnectedNodes(activeNode) : [];

  return (
    <section id="architecture" className="py-32 relative overflow-hidden">
      {/* Floating background particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, (i % 2 === 0 ? 20 : -20), 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.8, 1],
            }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </div>

      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-20"
          style={{ perspective: 1000 }}
        >
          <motion.p
            className="text-primary font-mono-custom text-sm mb-4 tracking-wider uppercase"
            initial={{ opacity: 0, y: 30, rotateX: 40 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
          >
            System Architecture
          </motion.p>
          <motion.h2
            className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground"
            initial={{ opacity: 0, rotateX: 80, y: 80, scale: 0.7 }}
            whileInView={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", damping: 18, stiffness: 80, delay: 0.1 }}
          >
            The <span className="text-gradient">Neural Stack</span>
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.2 }}
          >
            Low-latency inference at the edge. Six modular layers, zero single points of failure.
          </motion.p>
        </motion.div>

        {/* Animated connection line */}
        <motion.div
          className="hidden lg:block absolute left-1/2 top-[340px] w-px h-[500px] -translate-x-1/2"
          initial={{ scaleY: 0, opacity: 0 }}
          whileInView={{ scaleY: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.5 }}
          style={{ 
            background: "linear-gradient(180deg, transparent, hsl(191 91% 50% / 0.15), hsl(263 70% 50% / 0.15), transparent)",
            transformOrigin: "top"
          }}
        />

        <div className="grid lg:grid-cols-3 gap-6">
          {nodes.map((node, i) => (
            <Card3D key={node.id} index={i}>
              <motion.div
                className={`glass-card p-6 h-full cursor-pointer transition-all duration-500 group relative overflow-hidden ${
                  activeNode && !highlightedNodes.includes(node.id) ? "opacity-30 scale-[0.97]" : ""
                } ${activeNode === node.id ? "ring-1 ring-primary/50" : ""}`}
                onMouseEnter={() => setActiveNode(node.id)}
                onMouseLeave={() => setActiveNode(null)}
                whileHover={{ scale: 1.04, y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {/* Animated glow on hover */}
                <motion.div
                  className="absolute -inset-1 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, hsl(${node.color} / 0.08) 0%, transparent 70%)`,
                  }}
                />

                {/* Scanning line effect */}
                <motion.div
                  className="absolute top-0 left-0 w-full h-px opacity-0 group-hover:opacity-100"
                  style={{ background: `linear-gradient(90deg, transparent, hsl(${node.color} / 0.5), transparent)` }}
                  animate={{ y: [0, 200, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />

                <div className="flex items-start gap-4 relative z-10">
                  <motion.div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                      highlightedNodes.includes(node.id) && activeNode
                        ? "bg-primary/20 shadow-[0_0_20px_hsl(191_91%_50%/0.2)]"
                        : "bg-secondary"
                    }`}
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <node.icon
                      className={`h-5 w-5 transition-colors duration-300 ${
                        highlightedNodes.includes(node.id) && activeNode
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  </motion.div>
                  <div>
                    <h3 className="font-display text-base text-foreground">{node.label}</h3>
                    <p className="text-muted-foreground mt-1 font-mono-custom text-xs leading-relaxed">
                      {node.description}
                    </p>
                  </div>
                </div>
                {node.connections && (
                  <div className="mt-4 flex gap-2 flex-wrap relative z-10">
                    {node.connections.map((c, ci) => (
                      <motion.span
                        key={c}
                        className={`text-xs font-mono-custom px-2 py-0.5 rounded transition-all duration-300 ${
                          activeNode === node.id
                            ? "bg-primary/15 text-primary"
                            : "bg-secondary text-muted-foreground"
                        }`}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.12 + ci * 0.08 + 0.3 }}
                      >
                        → {nodes.find((n) => n.id === c)?.label}
                      </motion.span>
                    ))}
                  </div>
                )}
              </motion.div>
            </Card3D>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;

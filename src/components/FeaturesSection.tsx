import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Brain, Zap, Shield, Globe, MessageSquare, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Autonomous Reasoning",
    description: "Multi-step reasoning chains that handle complex queries without human intervention. Context-aware and self-correcting.",
  },
  {
    icon: Zap,
    title: "Edge Inference",
    description: "Low-latency inference at the edge. 47ms response time globally with our distributed inference mesh.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC2 Type II certified. End-to-end encryption, RBAC, and audit logging built into every interaction.",
  },
  {
    icon: Globe,
    title: "Omnichannel Deploy",
    description: "Deploy once, run everywhere. Web, mobile, Slack, Teams, WhatsApp—all from a single configuration.",
  },
  {
    icon: MessageSquare,
    title: "Conversational Memory",
    description: "Persistent memory across sessions. Aether remembers context, preferences, and past interactions.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Live dashboards tracking resolution rates, sentiment scores, and customer satisfaction in real time.",
  },
];

const FeatureCard3D = ({ children, index }: { children: React.ReactNode; index: number }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-150, 150], [20, -20]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-150, 150], [-20, 20]), { stiffness: 300, damping: 30 });
  const glareX = useTransform(x, [-150, 150], [0, 100]);
  const glareY = useTransform(y, [-150, 150], [0, 100]);

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(hover: none)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      initial={{ opacity: 0, rotateX: 90, y: 100, z: -300, scale: 0.8 }}
      whileInView={{ opacity: 1, rotateX: 0, y: 0, z: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, type: "spring", damping: 16, stiffness: 70 }}
      style={{ perspective: 1500 }}
    >
      <motion.div
        onMouseMove={handleMouse}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative group h-full"
        whileHover={{ z: 50 }}
      >
        {/* Intense dynamic glare effect */}
        <motion.div
          className="absolute inset-0 rounded-[24px] pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: useTransform(
              [glareX, glareY],
              ([gx, gy]) =>
                `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.15) 0%, transparent 60%)`
            ),
          }}
        />
        {children}
      </motion.div>
    </motion.div>
  );
};

const FeaturesSection = () => {
  return (
    <section id="features" className="py-32 relative overflow-hidden">
      {/* Background grid for this section */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: "linear-gradient(hsl(191 91% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(191 91% 50%) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-20 perspective-container"
          initial={{ opacity: 0, rotateX: 60, y: 60 }}
          whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
        >
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground">
            Built for <span className="text-gradient">Scale</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Every component engineered for enterprise-grade performance. No compromises.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FeatureCard3D key={feature.title} index={i}>
              <motion.div
                className="glass-card p-8 h-full group cursor-default relative overflow-hidden border border-white/5"
                whileHover={{ scale: 1.05, y: -10 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {/* Animated shimmer background on hover */}
                <motion.div
                  className="absolute inset-0 -z-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                  style={{
                    background: "conic-gradient(from 0deg, transparent, hsl(191 91% 50%), transparent)",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />

                <div className="relative z-10 transition-transform duration-300 group-hover:translate-z-20">
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-6 shadow-lg transition-all duration-300 group-hover:bg-primary/10"
                    whileHover={{ rotate: 12, scale: 1.15 }}
                  >
                    <feature.icon className="h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
                  </motion.div>
                  <h3 className="font-display text-2xl text-foreground mb-4 transition-colors duration-300 group-hover:text-primary">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed transition-colors duration-300 group-hover:text-foreground/80">
                    {feature.description}
                  </p>
                </div>
                
                {/* Intense hover glow at the bottom */}
                <motion.div
                  className="absolute -inset-px rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                  style={{
                    background: "radial-gradient(circle at 50% 100%, hsl(191 91% 50% / 0.12) 0%, transparent 70%)",
                  }}
                />
              </motion.div>
            </FeatureCard3D>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

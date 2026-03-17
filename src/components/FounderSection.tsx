import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Sparkles, Brain, Code, Terminal } from "lucide-react";

const FounderCard3D = ({ children, highlighted }: { children: React.ReactNode; highlighted: boolean }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-150, 150], [10, -10]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-150, 150], [-10, 10]), { stiffness: 300, damping: 30 });
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
      initial={{ opacity: 0, rotateX: 90, y: 100, z: -300, scale: 0.6 }}
      whileInView={{ opacity: 1, rotateX: 0, y: 0, z: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{
        delay: 0.18,
        type: "spring",
        damping: 16,
        stiffness: 70,
      }}
      style={{ perspective: 1000 }}
      className="w-full max-w-4xl mx-auto"
    >
      <motion.div
        onMouseMove={handleMouse}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative group w-full"
        whileHover={{ z: 30 }}
      >
        {/* Glare */}
        <motion.div
          className="absolute inset-0 rounded-[24px] pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: useTransform(
              [glareX, glareY],
              ([gx, gy]) =>
                `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.07) 0%, transparent 50%)`
            ),
          }}
        />
        {/* Floating shadow */}
        {highlighted && (
          <motion.div
            className="absolute -inset-4 rounded-[32px] -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: "radial-gradient(circle, hsl(263 70% 50% / 0.15) 0%, transparent 70%)",
              filter: "blur(25px)",
            }}
          />
        )}
        {children}
      </motion.div>
    </motion.div>
  );
};

const FounderSection = () => {
  return (
    <section id="founder" className="py-32 relative overflow-hidden">
      {/* Background grid lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(hsl(191 91% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(191 91% 50%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container mx-auto px-6">
        <motion.div className="text-center mb-16" style={{ perspective: 1000 }}>
          <motion.p
            className="text-primary font-mono-custom text-sm mb-4 tracking-wider uppercase"
            initial={{ opacity: 0, y: 20, rotateX: 40 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
          >
            Meet the Founder
          </motion.p>
          <motion.h2
            className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground"
            initial={{ opacity: 0, rotateX: 80, y: 80, scale: 0.7 }}
            whileInView={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", damping: 18, stiffness: 80, delay: 0.1 }}
          >
            Visionary <span className="text-gradient">Leadership</span>
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2, type: "spring", damping: 20 }}
          >
            Building intelligent systems that are as reliable as they are revolutionary.
          </motion.p>
        </motion.div>

        <div className="flex justify-center w-full">
          <FounderCard3D highlighted={true}>
            <motion.div
              className="glass-card p-8 md:p-12 relative overflow-hidden group gradient-border flex flex-col md:flex-row gap-8 lg:gap-12 items-center rounded-[24px]"
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Animated gradient shimmer */}
              <motion.div
                className="absolute inset-0 -z-0 opacity-10"
                style={{
                  background: "conic-gradient(from 0deg, transparent, hsl(263 70% 50%), hsl(191 91% 50%), transparent)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              />

              {/* Hover glow */}
              <motion.div
                className="absolute -inset-px rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                style={{
                  background: `radial-gradient(circle at 50% 100%, hsl(263 70% 50% / 0.15) 0%, transparent 60%)`,
                }}
              />

              <motion.div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 whitespace-nowrap"
                initial={{ y: -20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, type: "spring", damping: 15 }}
              >
                <Sparkles className="h-3 w-3" /> AETHER-Ai Creator
              </motion.div>

              <div className="w-56 h-56 md:w-72 md:h-72 shrink-0 relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group-hover:border-primary/50 transition-colors duration-500">
                <img
                  src="/founder.jpeg"
                  alt="Souharda Mandal"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=400&q=80"; // fallback
                  }}
                />
              </div>

              <div className="relative z-10 text-center md:text-left flex-1">
                <h3 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-2">Souharda Mandal</h3>
                <p className="text-primary font-mono-custom text-sm md:text-md tracking-wide mb-6">AI Engineer & B.Tech CSE (AI & ML)</p>

                <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-8">
                  An innovator at the intersection of Agentic RAG and high-performance software, I developed AETHER-Ai to bridge the gap between complex AI architecture and seamless user experience, my mission is to build intelligent systems that are as reliable as they are revolutionary.
                </p>

                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-white/5 text-sm font-medium text-foreground">
                    <Brain className="h-4 w-4 text-primary" /> Deep Learning
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-white/5 text-sm font-medium text-foreground">
                    <Code className="h-4 w-4 text-primary" /> Full-Stack Dev
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-white/5 text-sm font-medium text-foreground">
                    <Terminal className="h-4 w-4 text-primary" /> Prompt Engineering
                  </div>
                </div>
              </div>
            </motion.div>
          </FounderCard3D>
        </div>
      </div>
    </section>
  );
};

export default FounderSection;

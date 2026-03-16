import { useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight } from "lucide-react";
import mascot from "@/assets/mascot.png";

const HeroSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const mascotY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const mascotScale = useTransform(scrollYProgress, [0, 1], [1, 0.6]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (window.matchMedia("(hover: none)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left - rect.width / 2) * 0.02);
    mouseY.set((e.clientY - rect.top - rect.height / 2) * 0.02);
  };

  const textReveal = {
    initial: { opacity: 0, rotateX: 60, y: 80 },
    animate: {
      opacity: 1,
      rotateX: 0,
      y: 0,
      transition: { type: "spring", damping: 20, stiffness: 100, delay: 0.3 },
    },
  };

  const subReveal = {
    initial: { opacity: 0, y: 40 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", damping: 20, stiffness: 100, delay: 0.6 },
    },
  };

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-background/70" />
        <div className="absolute inset-0 mesh-gradient opacity-60" />
      </div>

      {/* Animated glow orbs on top */}
      <div className="absolute inset-0 overflow-hidden z-[1]">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(191 91% 50% / 0.3) 0%, transparent 70%)",
            top: "10%",
            left: "10%",
          }}
          animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, hsl(263 70% 50% / 0.3) 0%, transparent 70%)",
            bottom: "10%",
            right: "10%",
          }}
          animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div 
            style={{ y: textY, rotateX: springY, rotateY: springX }} 
            className="perspective-container"
          >
            <motion.div {...textReveal}>
              <h1
                className="font-display text-4xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.9] text-foreground tracking-tighter"
              >
                <span className="text-gradient drop-shadow-[0_0_35px_rgba(0,186,224,0.3)]">AETHER</span>
                <br />
                <span className="text-foreground">AI</span>
              </h1>
            </motion.div>

            <motion.p
              {...subReveal}
              className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-lg"
              style={{ lineHeight: 1.6, textWrap: "pretty" as any }}
            >
              Intelligence, Dimensionally Rendered. The first autonomous AI agent
              built for spatial workflows and high-density data. Not just a chat
              box—a team member.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, type: "spring", damping: 20 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <motion.a
                href="#pricing"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector("#pricing")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                Deploy Aether <ArrowRight className="h-4 w-4" />
              </motion.a>
              <motion.a
                href="#architecture"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector("#architecture")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-muted px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                View Architecture
              </motion.a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-8 flex items-center gap-6 text-sm text-muted-foreground"
            >
              <span className="font-mono-custom">47ms latency</span>
              <span className="w-1 h-1 rounded-full bg-primary" />
              <span className="font-mono-custom">99.99% uptime</span>
              <span className="w-1 h-1 rounded-full bg-primary" />
              <span className="font-mono-custom">SOC2</span>
            </motion.div>
          </motion.div>

          {/* Mascot */}
          <motion.div
            style={{ y: mascotY, scale: mascotScale, x: springX, rotateY: springX, rotateX: springY }}
            className="relative flex items-center justify-center"
          >
            <motion.div
              className="absolute w-80 h-80 rounded-full animate-pulse-glow"
              style={{
                background: "radial-gradient(circle, hsl(191 91% 50% / 0.1) 0%, transparent 70%)",
              }}
            />
            <motion.img
              src={mascot}
              alt="Aether AI Mascot - Futuristic AI Orb"
              className="relative z-10 w-64 h-64 sm:w-96 sm:h-96 object-contain animate-float drop-shadow-2xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 80, delay: 0.2 }}
            />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;

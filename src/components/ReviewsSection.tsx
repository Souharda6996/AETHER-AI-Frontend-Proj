import { useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Sarah Chen",
    role: "CTO, Meridian Labs",
    text: "Aether replaced our entire support team's L1 workflow. Resolution time dropped 73% in the first month.",
    rating: 5,
  },
  {
    name: "Marcus Reid",
    role: "VP Engineering, ScaleForce",
    text: "The architecture is genuinely impressive. 47ms latency at scale isn't marketing—it's real. We tested it.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Head of CX, Nuvola",
    text: "We deployed across 12 channels in a single afternoon. The omnichannel capability is best-in-class.",
    rating: 5,
  },
  {
    name: "James Kowalski",
    role: "Founder, DataStream AI",
    text: "Conversational memory is the killer feature. Aether remembers what our customers said 3 months ago.",
    rating: 5,
  },
  {
    name: "Elena Vasquez",
    role: "Director of Ops, Helios",
    text: "SOC2 compliance out of the box saved us 6 months of security work. Enterprise-ready from day one.",
    rating: 5,
  },
];

const ReviewCard3D = ({ children, index }: { children: React.ReactNode; index: number }) => {
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
      initial={{ opacity: 0, scale: 0.8, rotateY: 30 }}
      whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, type: "spring", damping: 20, stiffness: 100 }}
      style={{ perspective: 1500 }}
    >
      <motion.div
        onMouseMove={handleMouse}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative group h-full"
        whileHover={{ z: 50 }}
      >
        {/* Intensified dynamic glare effect */}
        <motion.div
          className="absolute inset-0 rounded-[20px] pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
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

const ReviewsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["5%", "-25%"]);

  return (
    <section id="reviews" ref={containerRef} className="py-32 overflow-hidden relative">
      <div className="container mx-auto px-6 mb-16">
        <motion.div
          className="perspective-container"
          initial={{ opacity: 0, rotateX: 60, y: 60 }}
          whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
        >
          <p className="text-primary font-mono-custom text-sm mb-4 tracking-wider uppercase">
            Testimonials
          </p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground">
            Trusted by <span className="text-gradient">Leaders</span>
          </h2>
        </motion.div>
      </div>

      <motion.div style={{ x }} className="flex gap-6 pl-6">
        {reviews.map((review, i) => (
          <ReviewCard3D key={review.name} index={i}>
            <motion.div
              className="glass-card p-8 min-w-[280px] sm:min-w-[350px] max-w-[400px] h-full shrink-0 relative overflow-hidden"
              whileHover={{ scale: 1.05, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <div className="relative z-10 transition-transform duration-300 group-hover:translate-z-20">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground text-sm leading-relaxed mb-6 group-hover:text-foreground italic">
                  "{review.text}"
                </p>
                <div>
                  <p className="font-display text-base text-foreground group-hover:text-primary transition-colors">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{review.role}</p>
                </div>
              </div>

              {/* Intense hover glow at the bottom */}
              <motion.div
                className="absolute -inset-px rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                style={{
                  background: "radial-gradient(circle at 50% 100%, hsl(191 91% 50% / 0.12) 0%, transparent 70%)",
                }}
              />
            </motion.div>
          </ReviewCard3D>
        ))}
      </motion.div>
    </section>
  );
};

export default ReviewsSection;

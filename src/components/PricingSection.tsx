import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Starter",
    monthlyPrice: 49,
    yearlyPrice: 39,
    description: "For early-stage teams testing AI-first support.",
    features: ["1,000 conversations/mo", "3 channels", "Basic analytics", "Email support", "5 team seats"],
    highlighted: false,
    glowColor: "191 91% 50%",
  },
  {
    name: "Pro",
    monthlyPrice: 199,
    yearlyPrice: 159,
    description: "For scaling teams that need full autonomy.",
    features: ["25,000 conversations/mo", "Unlimited channels", "Advanced analytics", "Priority support", "Unlimited seats", "Custom training", "API access"],
    highlighted: true,
    glowColor: "263 70% 50%",
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    yearlyPrice: null,
    description: "For organizations with custom infrastructure needs.",
    features: ["Unlimited conversations", "Dedicated infrastructure", "Custom SLA", "24/7 phone support", "SSO & SAML", "On-prem deployment", "Custom integrations"],
    highlighted: false,
    glowColor: "191 91% 50%",
  },
];

const PricingCard3D = ({ children, index, highlighted }: { children: React.ReactNode; index: number; highlighted: boolean }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-150, 150], [10, -10]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-150, 150], [-10, 10]), { stiffness: 300, damping: 30 });
  const glareX = useTransform(x, [-150, 150], [0, 100]);
  const glareY = useTransform(y, [-150, 150], [0, 100]);

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
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
        delay: index * 0.18,
        type: "spring",
        damping: 16,
        stiffness: 70,
      }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        onMouseMove={handleMouse}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative group"
        whileHover={{ z: 30 }}
      >
        {/* Glare */}
        <motion.div
          className="absolute inset-0 rounded-[20px] pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
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
            className="absolute -inset-4 rounded-[28px] -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: "radial-gradient(circle, hsl(263 70% 50% / 0.1) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
        )}
        {children}
      </motion.div>
    </motion.div>
  );
};

const PricingSection = () => {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="py-32 relative overflow-hidden">
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
            Pricing
          </motion.p>
          <motion.h2
            className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground"
            initial={{ opacity: 0, rotateX: 80, y: 80, scale: 0.7 }}
            whileInView={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", damping: 18, stiffness: 80, delay: 0.1 }}
          >
            Simple, <span className="text-gradient">Transparent</span>
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-muted-foreground"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2, type: "spring", damping: 20 }}
          >
            No hidden fees. Scale when you're ready.
          </motion.p>

          {/* Toggle */}
          <motion.div
            className="mt-8 flex items-center justify-center gap-4"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, type: "spring", damping: 20 }}
          >
            <span className={`text-sm transition-colors duration-300 ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <motion.button
              className="relative w-14 h-7 rounded-full bg-secondary p-1 overflow-hidden"
              onClick={() => setYearly(!yearly)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 opacity-0"
                animate={{ opacity: yearly ? 0.15 : 0 }}
                style={{ background: "linear-gradient(135deg, hsl(191 91% 50%), hsl(263 70% 50%))" }}
              />
              <motion.div
                className="w-5 h-5 rounded-full bg-primary relative z-10"
                animate={{ x: yearly ? 28 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </motion.button>
            <span className={`text-sm transition-colors duration-300 ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
              Yearly <span className="text-primary text-xs">Save 20%</span>
            </span>
          </motion.div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {plans.map((plan, i) => (
            <PricingCard3D key={plan.name} index={i} highlighted={plan.highlighted}>
              <motion.div
                className={`glass-card p-8 h-full relative overflow-hidden group ${
                  plan.highlighted ? "gradient-border" : ""
                }`}
                whileHover={{ scale: 1.03, y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {/* Animated gradient shimmer on highlighted card */}
                {plan.highlighted && (
                  <motion.div
                    className="absolute inset-0 -z-0 opacity-10"
                    style={{
                      background: "conic-gradient(from 0deg, transparent, hsl(263 70% 50%), hsl(191 91% 50%), transparent)",
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  />
                )}

                {/* Hover glow */}
                <motion.div
                  className="absolute -inset-px rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                  style={{
                    background: `radial-gradient(circle at 50% 100%, hsl(${plan.glowColor} / 0.1) 0%, transparent 60%)`,
                  }}
                />

                {plan.highlighted && (
                  <motion.div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1"
                    initial={{ y: -20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, type: "spring", damping: 15 }}
                  >
                    <Sparkles className="h-3 w-3" /> Most Popular
                  </motion.div>
                )}

                <div className="relative z-10">
                  <h3 className="font-display text-2xl text-foreground">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mt-2">{plan.description}</p>

                  <div className="mt-6 mb-8">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={yearly ? "yearly" : "monthly"}
                        initial={{ opacity: 0, rotateX: -90, y: -20 }}
                        animate={{ opacity: 1, rotateX: 0, y: 0 }}
                        exit={{ opacity: 0, rotateX: 90, y: 20 }}
                        transition={{ type: "spring", damping: 20, stiffness: 200 }}
                      >
                        {plan.monthlyPrice ? (
                          <div className="flex items-baseline gap-1">
                            <span className="font-display text-5xl text-foreground">
                              ${yearly ? plan.yearlyPrice : plan.monthlyPrice}
                            </span>
                            <span className="text-muted-foreground text-sm">/mo</span>
                          </div>
                        ) : (
                          <span className="font-display text-3xl text-foreground">Custom</span>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat, fi) => (
                      <motion.li
                        key={feat}
                        className="flex items-start gap-3 text-sm text-muted-foreground"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.18 + fi * 0.05 + 0.4, type: "spring", damping: 20 }}
                      >
                        <motion.div
                          whileInView={{ scale: [0, 1.3, 1] }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.18 + fi * 0.05 + 0.5 }}
                        >
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        </motion.div>
                        {feat}
                      </motion.li>
                    ))}
                  </ul>

                  <motion.button
                    className={`w-full rounded-lg py-3 text-sm font-semibold transition-all duration-300 ${
                      plan.highlighted
                        ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(191_91%_50%/0.2)]"
                        : "bg-secondary text-foreground hover:bg-muted"
                    }`}
                    whileHover={{ scale: 1.03, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {plan.monthlyPrice ? "Get Started" : "Contact Sales"}
                  </motion.button>
                </div>
              </motion.div>
            </PricingCard3D>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

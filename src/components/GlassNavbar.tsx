import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Architecture", href: "#architecture" },
  { label: "Demo", href: "#demo" },
  { label: "Reviews", href: "#reviews" },
  { label: "Pricing", href: "#pricing" },
];

const GlassNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveLink(`#${entry.target.id}`);
          }
        });
      },
      { threshold: 0.3 }
    );
    navLinks.forEach((link) => {
      const el = document.querySelector(link.href);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className={`fixed top-4 inset-x-0 mx-auto z-50 w-[95%] max-w-5xl rounded-2xl transition-all duration-500 ${
        scrolled ? "glass" : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex flex-1 justify-start">
          <motion.a
            href="#"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="flex items-center gap-2 text-foreground"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="h-6 w-6 text-primary" />
            <span className="font-display text-xl">AETHER</span>
          </motion.a>
        </div>

        <div className="hidden md:flex flex-none items-center gap-1 relative">
          {navLinks.map((link) => (
            <motion.button
              key={link.href}
              onClick={() => handleClick(link.href)}
              className="relative px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {activeLink === link.href && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 rounded-lg bg-secondary"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{link.label}</span>
            </motion.button>
          ))}
        </div>

        <div className="flex flex-1 justify-end">
          <div className="hidden md:block">
            <Link to="/chat">
              <motion.button
                className="whitespace-nowrap rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                whileHover={{ scale: 1.05, y: -2, boxShadow: "0_0_25px_rgba(var(--primary-rgb),0.6)" }}
                whileTap={{ scale: 0.95 }}
              >
                Launch Aether
              </motion.button>
            </Link>
          </div>

          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden md:hidden"
          >
            <div className="flex flex-col gap-2 px-6 pb-6 pt-2 glass m-2 rounded-xl border border-white/5 shadow-2xl">
              {navLinks.map((link) => (
                <motion.button
                  key={link.href}
                  onClick={() => handleClick(link.href)}
                  className="text-left py-3 text-base font-medium text-muted-foreground hover:text-foreground transition-colors border-b border-white/5 last:border-0"
                  whileTap={{ x: 5, color: "var(--primary)" }}
                >
                  {link.label}
                </motion.button>
              ))}
              <motion.button
                onClick={() => handleClick("#pricing")}
                className="whitespace-nowrap mt-4 rounded-lg bg-primary px-5 py-3 text-base font-semibold text-primary-foreground shadow-lg"
                whileTap={{ scale: 0.95 }}
              >
                Deploy Aether
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default GlassNavbar;

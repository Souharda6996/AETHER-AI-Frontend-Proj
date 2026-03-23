import { motion } from "framer-motion";
import { Zap, Github, Twitter, Linkedin, Mail } from "lucide-react";

const footerLinks = {
  Product: ["Features", "Architecture", "Pricing", "Changelog"],
  Company: ["About", "Blog", "Careers", "Press"],
  Resources: ["Documentation", "API Reference", "Community", "Status"],
  Legal: ["Privacy", "Terms", "Security", "DPA"],
};

const FooterSection = () => {
  return (
    <footer className="border-t border-[#5A8F76]/30 py-20 footer-gradient">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-12">
          <div className="md:col-span-1">
            <motion.a
              href="#"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="flex items-center gap-2 text-[#EEE8B2] mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <img src="/aether-logo.png" alt="Aether AI" className="h-6 w-6 rounded-md" />
              <span className="font-display text-lg text-[#C18D52]">AETHER</span>
            </motion.a>
            <p className="text-sm text-[#5A8F76] leading-relaxed">
              Intelligence, Dimensionally Rendered.
            </p>
            <div className="flex gap-3 mt-6">
              {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-[#203B37] border border-[#5A8F76]/30 flex items-center justify-center text-[#5A8F76] hover:text-[#C18D52] transition-colors"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-display text-sm text-[#C18D52] mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-[#EEE8B2]/70 hover:text-[#C18D52] transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-[#5A8F76]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#5A8F76]">
            © 2026 Aether AI. All rights reserved.
          </p>
          <p className="text-xs text-[#5A8F76] font-mono-custom">
            v2.4.1 · Built with conviction
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;

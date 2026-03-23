import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";

const LoginPage = () => {
  const [loadingAction, setLoadingAction] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleAuth = async () => {
    setLoadingAction(true);
    try {
      await loginWithGoogle();
      navigate("/chat");
    } catch (error: any) {
      toast.error(error.message || "Failed to authenticate with Google.");
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050508] text-foreground flex flex-col font-sans overflow-hidden">
      {/* Animated Glowing Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      <header className="relative z-10 p-6">
        <Link to="/" className="flex items-center gap-2 group w-fit">
          <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <div className="flex items-center gap-2">
            <img src="/aether-logo.png" alt="Aether AI" className="h-7 w-7 rounded-md" />
            <span className="font-display text-xl tracking-tight">AETHER</span>
          </div>
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md bg-white/[0.02] backdrop-blur-3xl border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-3xl p-8 lg:p-10 relative overflow-hidden group"
        >
          {/* subtle card inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="text-center mb-10 relative z-20">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
              className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,229,255,0.15)] ring-1 ring-primary/20"
            >
              <img src="/aether-logo.png" alt="Aether AI" className="h-10 w-10 rounded-lg drop-shadow-[0_0_15px_rgba(193,141,82,0.5)]" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl font-display font-medium tracking-tight mb-3 text-white"
            >
              Welcome Back
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-muted-foreground text-sm leading-relaxed max-w-[280px] mx-auto"
            >
              Authenticate to access the Aether intelligence network seamlessly.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="relative z-20"
          >
            <button
              onClick={handleGoogleAuth}
              disabled={loadingAction}
              className="w-full h-[54px] rounded-2xl bg-white text-black font-semibold flex items-center justify-center gap-3 disabled:opacity-50 transition-all duration-300 hover:bg-gray-50 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98] group/btn relative overflow-hidden"
            >
              {loadingAction ? (
                <Loader2 className="h-5 w-5 animate-spin text-black" />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover/btn:scale-110" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default LoginPage;

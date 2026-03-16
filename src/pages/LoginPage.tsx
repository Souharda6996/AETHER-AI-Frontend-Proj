import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const { loginWithEmail, signupWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill in all fields.");
    
    setLoadingAction(true);
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password);
      }
      navigate("/chat");
    } catch (error: any) {
      toast.error(error.message || "Failed to authenticate.");
    } finally {
      setLoadingAction(false);
    }
  };

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
    <div className="min-h-screen bg-[#050508] text-foreground flex flex-col font-sans">
      <header className="p-6">
        <Link to="/" className="flex items-center gap-2 group w-fit">
          <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-display text-xl tracking-tight">AETHER</span>
          </div>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0a0a14] border border-[#1a1a2e] rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">
              {isLogin ? "Welcome Back" : "Initialize Neural Link"}
            </h1>
            <p className="text-muted-foreground text-sm">
              Authenticate to access the Aether intelligence network.
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-1 block">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0f0f1c] border border-[#1a1a2e] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="operative@domain.com"
                required
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-1 block">
                Security Keyphrase
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0f0f1c] border border-[#1a1a2e] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loadingAction}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(0,229,255,0.2)]"
            >
              {loadingAction ? <Loader2 className="h-5 w-5 animate-spin" /> : (isLogin ? "Authenticate" : "Establish Link")}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-[#1a1a2e]"></div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">OR</span>
            <div className="flex-1 h-px bg-[#1a1a2e]"></div>
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={loadingAction}
            className="w-full h-12 rounded-xl bg-white text-black font-semibold flex items-center justify-center gap-3 disabled:opacity-50 transition-all hover:bg-gray-100 active:scale-[0.98]"
          >
            {loadingAction ? (
              <Loader2 className="h-5 w-5 animate-spin text-black" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Don't have clearance?" : "Already have clearance?"}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-primary font-semibold hover:underline"
              >
                {isLogin ? "Request Access" : "Authenticate Here"}
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;

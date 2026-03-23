import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

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
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-sm">
              Authenticate to access the Aether intelligence network.
            </p>
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
        </div>
      </main>
    </div>
  );
};

export default LoginPage;

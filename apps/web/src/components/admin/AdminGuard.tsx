import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { ShieldAlert, Loader2 } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  const isAdmin = profile?.role === "admin" || user?.email?.toLowerCase() === "kr.yashansh123@gmail.com";

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/sign-in", { replace: true });
      } else if (!isAdmin) {
        setShowAccessDenied(true);
      }
    }
  }, [user, profile, loading, navigate, isAdmin]);

  useEffect(() => {
    if (showAccessDenied) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/app", { replace: true });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showAccessDenied, navigate]);

  // Loading skeleton screen
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#07080A] text-white">
        <div className="relative flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
          <p className="font-mono text-sm tracking-widest text-neutral-400 uppercase animate-pulse">
            Authenticating Admin Session...
          </p>
        </div>
      </div>
    );
  }

  // Access Denied Screen (Cyberpunk aesthetic)
  if (showAccessDenied) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#07080A] text-white px-4">
        <div className="max-w-md w-full bg-gradient-to-b from-[#1e1015] to-[#0d0709] border border-red-500/20 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.1)] relative overflow-hidden">
          {/* Cyberpunk Tilted Grid Strip */}
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(to right, #ef4444 1px, transparent 1px), linear-gradient(to bottom, #ef4444 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              transform: "perspective(300px) rotateX(45deg) translateY(-20%)"
            }}
          />
          
          <div className="relative z-10 flex flex-col items-center gap-5">
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 animate-bounce">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h1 className="font-heading text-2xl font-black tracking-wide text-white">
              ACCESS DENIED
            </h1>
            <p className="text-sm text-neutral-400 leading-relaxed font-sans">
              Your account does not possess the administrator security clearance required to enter this operational control center.
            </p>
            <div className="mt-4 pt-4 border-t border-red-500/10 w-full">
              <p className="font-mono text-[12px] text-red-400/80">
                Redirecting to dashboard in {countdown}s...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Session verified & Role confirmed
  return user && isAdmin ? <>{children}</> : null;
}

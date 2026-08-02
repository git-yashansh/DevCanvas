import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle, Eye, EyeOff, Layout, Code2, Database, Globe, Network } from "lucide-react";
import { GoogleIcon } from "@/components/auth/google-icon";
import { useAuth } from "@/lib/auth-context";
import Silk from "@/components/ui/Silk";
import logoImg from "../logo.png";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type FormValues = z.infer<typeof schema>;

const FEATURES = [
  {
    icon: Layout,
    title: "AI App Builder",
    desc: "End-to-end full stack web apps",
    iconColor: "text-emerald-400",
    shadow: "shadow-emerald-500/5",
  },
  {
    icon: Code2,
    title: "UI Generator",
    desc: "React & Tailwind components",
    iconColor: "text-blue-400",
    shadow: "shadow-blue-500/5",
  },
  {
    icon: Database,
    title: "Database Generator",
    desc: "Postgres schemas & migrations",
    iconColor: "text-purple-400",
    shadow: "shadow-purple-500/5",
  },
  {
    icon: Globe,
    title: "API Generator",
    desc: "REST & GraphQL endpoints",
    iconColor: "text-orange-400",
    shadow: "shadow-orange-500/5",
  },
  {
    icon: Network,
    title: "Architecture Designer",
    desc: "System design & cloud infra",
    iconColor: "text-cyan-400",
    shadow: "shadow-cyan-500/5",
  },
];

export function SignInPage() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  async function handleGoogle() {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) { setServerError(error); setGoogleLoading(false); }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    const { error } = await signIn(values.email, values.password);
    if (error) {
      setServerError(error);
      setSubmitting(false);
      return;
    }
    setShowSuccessPopup(true);
    setSubmitting(false);
    setTimeout(() => {
      navigate("/app");
    }, 2000);
  }

  return (
    <div className="h-screen w-screen text-white flex flex-col font-sans overflow-hidden relative selection:bg-emerald-500/30">
      {/* Silk Animated Background (More visible with color #0e1b2e and noiseIntensity 0.8) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Silk speed={1.5} scale={1.2} color="#0e1b2e" noiseIntensity={0.8} />
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 animate-fade-in">
          <div className="bg-[#121620]/90 border border-emerald-500/30 rounded-2xl p-6 flex flex-col items-center gap-4 text-center max-w-xs shadow-[0_0_50px_rgba(16,185,129,0.25)]">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Logged in successfully</h3>
              <p className="text-xs text-neutral-400 mt-1">Redirecting you to in DevWorld...</p>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="w-full flex items-center justify-between px-6 py-4 md:px-12 z-20 relative shrink-0">
        <div className="flex items-center gap-2">
          {/* Logo.png size increased to h-12 */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="DevCanvas" className="h-14 w-auto object-contain" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-neutral-400 text-sm">
          <a href="#" className="hover:text-white transition-colors">Prices</a>
          <a href="#" className="hover:text-white transition-colors">Opportunities</a>
          <a href="#" className="hover:text-white transition-colors">Blog</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/sign-in" className="px-4 py-2 text-sm text-black font-semibold bg-gradient-to-r from-[#9efdd7] to-[#4fa2fe] rounded-lg shadow-[0_0_15px_rgba(79,162,254,0.3)] hover:brightness-105 transition-all">
            Log in
          </Link>
          <Link to="/sign-up" className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition-colors border border-white/10 rounded-lg hover:bg-white/5">
            Sign up
          </Link>
        </div>
      </header>

      {/* Main Split Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 relative w-full items-stretch z-10 overflow-hidden">
        
        {/* Left Column: Form */}
        <div className="flex flex-col justify-center items-center px-6 py-6 md:px-12 relative overflow-y-auto">
          <div className="w-full max-w-[420px] space-y-5">
            <div className="space-y-1">
              <h1 className="font-serif italic font-bold text-4xl text-white text-left tracking-wide drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                Log in
              </h1>
              <p className="text-neutral-400 text-xs text-left">Sign in to your account to continue</p>
            </div>

            {serverError ? (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {serverError}
              </div>
            ) : null}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-neutral-400 tracking-wide">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="j.nicholson@gmail.com"
                  className="w-full h-12 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md px-4 text-sm text-white placeholder:text-neutral-600 focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/20 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] focus:outline-none hover:border-white/20 transition-all duration-300"
                  {...register("email")}
                />
                {errors.email ? (
                  <p className="text-xs text-red-400 mt-0.5">{errors.email.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-neutral-400 tracking-wide">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    className="w-full h-12 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md pl-4 pr-10 text-sm text-white placeholder:text-neutral-600 focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/20 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] focus:outline-none hover:border-white/20 transition-all duration-300"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                {errors.password ? (
                  <p className="text-xs text-red-400 mt-0.5">{errors.password.message}</p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-[#9efdd7] to-[#4fa2fe] text-black font-bold text-sm shadow-[0_0_20px_rgba(79,162,254,0.2)] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(79,162,254,0.45)] hover:brightness-105 active:scale-[0.98] transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) flex items-center justify-center gap-2 mt-6"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ready To Dive In"}
              </button>
            </form>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-4 mt-5">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading || submitting}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/5 bg-[#121620]/40 hover:bg-[#121620]/60 hover:border-white/10 hover:scale-[1.01] text-sm font-medium transition-all text-neutral-300"
              >
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
                <span>Google</span>
              </button>
              <button
                type="button"
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/5 bg-[#121620]/40 hover:bg-[#121620]/60 hover:border-white/10 hover:scale-[1.01] text-sm font-medium transition-all text-neutral-300"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-2.415-2.507 0-1.428 1.155-2.5 2.415-2.5.956 0 2.415 1.072 2.415 2.507 0 1.428-1.155 2.5-2.415 2.5zm5.72 15.104c-.903 0-1.922-.612-3.031-.612-1.155 0-2.078.612-2.961.612-.903 0-1.745-.612-2.587-.612-.871 0-1.579.529-2.316.598-.829.078-1.52-.407-2.1-.963-2.148-2.054-3.328-5.748-3.328-9.083 0-4.992 3.193-7.585 6.044-7.585 1.413 0 2.555.772 3.516.772.903 0 2.11-.772 3.529-.772 2.639 0 5.438 2.062 6.064 5.348-4.708 1.956-4.017 8.358.858 10.024-.51 1.419-1.258 2.766-2.129 3.693-.665.731-1.341 1.439-2.059 1.439v-.061z" />
                </svg>
                <span>Apple</span>
              </button>
            </div>
          </div>
        </div>

        {/* Vertical Separator Line */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-emerald-400/35 to-transparent z-15">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[8px] h-[150px] bg-emerald-400/10 blur-[8px] rounded-full" />
        </div>

        {/* Right Column: Custom, Highly Polished Premium Section */}
        <div className="hidden lg:flex flex-col justify-center items-center p-10 relative overflow-hidden select-none">
          <div className="z-10 w-full max-w-[480px] space-y-8 text-center">
            
            {/* Redesigned Glowing Header: Even bigger */}
            <div className="space-y-3">
              <h2 className="font-serif italic font-extrabold text-5xl md:text-6xl text-white tracking-wide drop-shadow-[0_0_25px_rgba(255,255,255,0.45)]">
                <img src={logoImg} alt="DevCanvas" className="h-49 w-auto object-contain" />
              </h2>
              {/* <p className="text-neutral-300 text-sm font-medium max-w-[400px] mx-auto leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                Ready to explore the features of the DevCanvas AI platform?
              </p> */}
            </div>

            {/* Custom, premium card layout with transparent icon backgrounds */}
            <div className="space-y-3.5 text-left">
              {FEATURES.map((feat, index) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className={`group relative flex items-center gap-4 p-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-0.5 shadow-2xl hover:${feat.shadow}`}
                    style={{
                      transitionDelay: `${index * 50}ms`
                    }}
                  >
                    {/* Glowing background radial blur on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-cyan-500/0 group-hover:from-transparent group-hover:to-white/[0.02] transition-all pointer-events-none" />

                    {/* Transparent icon background with direct coloring */}
                    <div className={`p-3 shrink-0 group-hover:rotate-6 transition-transform duration-500 ${feat.iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-white tracking-wider uppercase group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-neutral-400 transition-colors">
                        {feat.title}
                      </h4>
                      <p className="text-[12px] text-neutral-400 mt-1 group-hover:text-neutral-350 transition-colors">
                        {feat.desc}
                      </p>
                    </div>

                    {/* Cute hover indicator arrow */}
                    <div className="text-neutral-600 group-hover:text-white group-hover:translate-x-1 transition-all duration-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}

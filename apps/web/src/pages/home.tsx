import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Plus,
  ChevronRight,
  Boxes,
  Bot,
  CreditCard,
  ShoppingCart,
  Layout,
} from "lucide-react";
import { useCreateProject } from "@/lib/queries/projects";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@utils/cn";

export function HomePage() {
  const { profile, user } = useAuth();
  const createProjectMutation = useCreateProject();
  const navigate = useNavigate();

  const [promptText, setPromptText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updatePromptText = (val: string) => {
    setPromptText(val);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, 0);
  };

  const handleStartGeneration = async (
    customName?: string,
    customDesc?: string,
    customTags?: string[]
  ) => {
    const name =
      customName ||
      (promptText.trim().split(" ").slice(0, 3).join(" ") || "New Project");
    const desc = customDesc || promptText.trim();

    if (!desc) return;

    setIsGenerating(true);
    try {
      const newProj = await createProjectMutation.mutateAsync({
        name,
        description: desc || "Pre-configured project template.",
        tags: customTags || ["AI SaaS", "API Spec", "Web Framework"],
      });
      navigate(`/app/projects/${newProj.id}`);
    } catch (err) {
      console.error("Failed to generate project: ", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const examplePrompts = [
    {
      label: "SaaS Platform",
      prompt:
        "A multi-tenant SaaS platform with custom subscription plans and Stripe billing.",
      icon: Layout,
    },
    {
      label: "AI SaaS",
      prompt:
        "A subscription-based AI SaaS platform where users input text prompts to generate audio tracks.",
      icon: Bot,
    },
    {
      label: "Fintech",
      prompt:
        "A secure wealth management fintech platform featuring KYC checks and real-time ledger synchronization.",
      icon: CreditCard,
    },
    {
      label: "E-commerce",
      prompt:
        "A modern digital marketplace with product catalog search, shopping carts, and Checkout API integration.",
      icon: ShoppingCart,
    },
    {
      label: "CRM",
      prompt:
        "An enterprise CRM with pipeline deal boards, lead scoring mechanisms, and team collaboration logs.",
      icon: Boxes,
    },
  ];

  const navLinks = ["About", "Services", "Journal", "Contact"];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0a0608] text-white font-inter select-none">
      {/* ── 1. Background Video ── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-80 pointer-events-none"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260613_180732_a54afbf6-b30d-470e-861f-669871f09f67.mp4"
      />

      {/* ── 2. Dark Overlay ── */}
      <div className="absolute inset-0 bg-black/35 z-10 pointer-events-none" />

      {/* ── 3. Main Center Content with AI Search Bar (Shifted up with wider text) ── */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-6 text-center pt-8 pb-12 max-w-6xl mx-auto space-y-8 -mt-10">
        {/* Main Heading */}
        <div className="space-y-3 max-w-5xl">
          <h1 className="font-instrument italic text-white text-4xl sm:text-6xl md:text-7xl lg:text-[92px] leading-[0.95] tracking-wide text-glow select-none">
            Describe what you want to build?
          </h1>
          <p className="text-white/70 text-sm sm:text-base text-center max-w-2xl mx-auto font-normal leading-relaxed">
            Turn your ideas into production-ready software{" "}
            <span className="text-white font-medium">with the power of AI.</span>
          </p>
        </div>

        {/* ── AI Search Area with Ambient Aura Light ── */}
        <div className="w-full max-w-3xl mt-4 relative z-20 search-container-wrapper">
          {/* Glowing Ambient Aura Backdrop */}
          <div className="absolute -inset-6 bg-gradient-to-r from-amber-500/25 via-pink-500/30 to-indigo-500/30 rounded-3xl blur-2xl opacity-75 pointer-events-none z-[-1]" />
          
          <div className="search-container-gradient">
            <div className="search-container-inner px-5 pt-5 pb-4 bg-[#0d1117]/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl">
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={promptText}
                onChange={(e) => updatePromptText(e.target.value)}
                placeholder="Describe what you want to build..."
                rows={2}
                className="w-full bg-transparent border-none outline-none text-[18px] font-normal text-white placeholder-white/40 resize-none min-h-[60px] max-h-[250px] font-sans leading-relaxed focus:ring-0 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleStartGeneration();
                  }
                }}
              />

              {/* Bottom Action Row */}
              <div className="flex items-center justify-between mt-3">
                {/* Left: Plus */}
                <div className="flex items-center gap-2">
                  <button className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Right: Create + Options */}
                <div className="flex items-center gap-2">
                  <button
                    disabled={isGenerating || !promptText.trim()}
                    onClick={() => handleStartGeneration()}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-sm font-medium transition-all cursor-pointer select-none border border-white/10"
                  >
                    <Sparkles
                      className={cn(
                        "h-3.5 w-3.5",
                        promptText.trim() ? "text-violet-400" : "text-neutral-400"
                      )}
                    />
                    <span>Create</span>
                  </button>
                  <button className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer">
                    <span className="text-[13px] font-bold tracking-wide select-none">
                      ···
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 relative z-20 text-xs">
          {examplePrompts.map((p, idx) => {
            const Icon = p.icon;
            return (
              <button
                key={idx}
                onClick={() => updatePromptText(p.prompt)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/15 bg-black/40 backdrop-blur-md hover:bg-white/10 hover:border-white/30 text-white/80 hover:text-white transition-all cursor-pointer select-none"
              >
                <Icon className="h-3.5 w-3.5 text-white/60" />
                <span>{p.label}</span>
              </button>
            );
          })}
          <button className="flex items-center gap-0.5 text-indigo-300 hover:text-white font-semibold px-2 py-1.5 transition-colors cursor-pointer">
            <span>More ideas</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;

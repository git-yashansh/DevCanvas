import React, { useEffect, useState, useMemo } from "react";
import { useDevBot } from "./DevBotContext";
import { ChevronRight, ChevronLeft, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function DevBotTour() {
  const {
    tourActive,
    tourStep,
    steps,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  } = useDevBot();

  const [rect, setRect] = useState<DOMRect | null>(null);

  // Sync highlighting dimensions when step changes or window resizes
  useEffect(() => {
    if (!tourActive) {
      setRect(null);
      return;
    }

    const currentStep = steps[tourStep];
    if (!currentStep?.selector) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(currentStep.selector!);
      if (el) {
        setRect(el.getBoundingClientRect());
        // Scroll target into center view for mobile / laptop screens
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        console.warn(
          `[DevBotTour Warning] Target selector "${currentStep.selector}" not found on current page. Falling back to center view.`
        );
        setRect(null);
      }
    };

    updateRect();
    
    // Add small timeouts to catch any dynamic sidebar toggles or page reflows
    const t1 = setTimeout(updateRect, 50);
    const t2 = setTimeout(updateRect, 300);

    window.addEventListener("resize", updateRect);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", updateRect);
    };
  }, [tourStep, tourActive, steps]);

  if (!tourActive) return null;

  const currentStep = steps[tourStep];
  const isFirst = tourStep === 0;
  const isLast = tourStep === steps.length - 1;

  // Compute position coordinates
  const cardStyle = (() => {
    // 1. Mobile responsive bottom panel layout
    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      return {
        position: "fixed" as const,
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: 340,
        zIndex: 50,
      };
    }

    // 2. Desktop aligned panel layout
    if (!rect) {
      return {
        position: "fixed" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 340,
        zIndex: 50,
      };
    }

    const cardWidth = 330;
    const gap = 14;

    let top = 0;
    let left = 0;

    if (currentStep.placement === "bottom") {
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - cardWidth / 2;
    } else if (currentStep.placement === "top") {
      top = rect.top - 200 - gap; // safe offset
      left = rect.left + rect.width / 2 - cardWidth / 2;
    } else if (currentStep.placement === "right") {
      top = rect.top + rect.height / 2 - 90;
      left = rect.right + gap;
    } else if (currentStep.placement === "left") {
      top = rect.top + rect.height / 2 - 90;
      left = rect.left - cardWidth - gap;
    } else {
      return {
        position: "fixed" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 340,
        zIndex: 50,
      };
    }

    // Keep layout safe within viewport boundaries
    const padding = 16;
    if (left < padding) left = padding;
    if (left + cardWidth > window.innerWidth - padding) {
      left = window.innerWidth - cardWidth - padding;
    }
    if (top < padding) top = padding;
    // Lower vertical boundaries constraint
    if (top > window.innerHeight - 220) {
      top = window.innerHeight - 220;
    }

    return {
      position: "fixed" as const,
      top,
      left,
      width: cardWidth,
      zIndex: 50,
      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    };
  })();

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none">
      {/* ── 1. Spotlight Focus Ring ── */}
      {rect && (
        <div
          className="tour-spotlight fixed rounded-xl pointer-events-auto"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 9999px rgba(3, 3, 5, 0.72)",
          }}
        />
      )}

      {/* ── Fullscreen Backdrop when in center step ── */}
      {!rect && (
        <div className="fixed inset-0 bg-[#030305]/72 pointer-events-auto transition-opacity" />
      )}

      {/* ── 2. Walkthrough Card ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tourStep}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={cardStyle}
          className="pointer-events-auto flex flex-col rounded-2xl border border-white/10 bg-[#0A0A0E] p-4.5 shadow-2xl shadow-black/80"
        >
          {/* Card Close */}
          <button
            onClick={skipTour}
            className="absolute top-3.5 right-3.5 text-white/40 hover:text-white transition-colors cursor-pointer"
            aria-label="Skip Tour"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Icon Header */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-indigo-400">
              DevCanvas Tour (Step {tourStep + 1} of {steps.length})
            </span>
          </div>

          {/* Title & Description */}
          <h3 className="mt-3.5 text-sm font-heading font-bold text-white leading-tight">
            {currentStep.title}
          </h3>
          <p className="mt-2 text-xs text-white/60 leading-normal font-sans">
            {currentStep.description}
          </p>

          {/* Progress Indicators Bar */}
          <div className="mt-5 flex w-full gap-1 rounded-full overflow-hidden bg-neutral-900 h-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-full flex-1 transition-all duration-300 ${
                  idx <= tourStep ? "bg-indigo-500" : "bg-neutral-800"
                }`}
              />
            ))}
          </div>

          {/* Action Row */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={skipTour}
              className="text-[11px] font-heading font-semibold text-neutral-450 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={prevStep}
                  className="inline-flex h-7.5 items-center gap-1 rounded-xl border border-white/5 bg-white/[0.02] px-3 text-xs font-semibold text-white/80 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              )}

              <button
                onClick={isLast ? completeTour : nextStep}
                className="inline-flex h-7.5 items-center gap-1 rounded-xl bg-indigo-600 px-3.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors cursor-pointer active:scale-95"
              >
                {isLast ? "Start Building" : "Next"}
                {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { AIOrb } from "./AIOrb";

const TIMELINE_STEPS = [
  "Understanding requirements...",
  "Generating content...",
  "Validating structures...",
  "Creating interactive diagrams...",
  "Estimating infrastructure costs...",
  "Analyzing potential security risks...",
  "Designing system architecture...",
  "Designing database models...",
  "Generating OpenAPI specs...",
  "Generating README & documentation...",
  "Preparing deployment scripts...",
  "Performing final schema validation...",
  "Done."
];

interface AILoaderProps {
  onComplete?: () => void;
  isFinished: boolean; // Triggers immediate fast-forward to the end
}

export function AILoader({ isFinished, onComplete }: AILoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (isFinished) {
      // Fast forward to end
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < TIMELINE_STEPS.length - 1) {
            setCompletedSteps((prevCompleted) => [...prevCompleted, prev]);
            return prev + 1;
          } else {
            clearInterval(interval);
            if (onComplete) onComplete();
            return prev;
          }
        });
      }, 100);
      return () => clearInterval(interval);
    } else {
      // Normal slow progress simulation
      const timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < TIMELINE_STEPS.length - 3) {
            setCompletedSteps((prevCompleted) => [...prevCompleted, prev]);
            return prev + 1;
          }
          return prev;
        });
      }, 1200);
      return () => clearInterval(timer);
    }
  }, [isFinished, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Dynamic Morphing AI Orb */}
      <AIOrb scale={isFinished ? 0.8 : 1} />

      {/* Progress Timeline List */}
      <div className="mt-12 w-full max-w-sm space-y-3.5 px-6">
        {TIMELINE_STEPS.map((step, idx) => {
          const isDone = completedSteps.includes(idx) || (isFinished && idx < TIMELINE_STEPS.length - 1);
          const isActive = idx === currentStep && !isFinished;
          const isFuture = idx > currentStep && !isFinished;

          if (isFuture && idx !== currentStep + 1 && idx !== currentStep + 2) {
            // Keep the loading screen clean by hiding far future steps
            return null;
          }

          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3.5 text-sm"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                {isDone ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/25 border border-emerald-500/35 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                  >
                    <Check className="h-2.5 w-2.5 stroke-[3px]" />
                  </motion.span>
                ) : isActive ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-700" />
                )}
              </div>

              <span
                className={`font-mono text-xs tracking-wide transition-all ${
                  isDone
                    ? "text-neutral-400 font-medium"
                    : isActive
                    ? "text-primary-300 font-semibold animate-pulse"
                    : "text-neutral-600"
                }`}
              >
                {step}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

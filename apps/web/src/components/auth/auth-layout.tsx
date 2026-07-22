import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AuroraBackground } from "@/components/aurora-background";
import { site } from "@config/index";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuroraBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-600 shadow-lg shadow-primary-500/30">
              <span className="font-heading text-sm font-bold text-white">D</span>
            </div>
            <span className="font-heading text-lg font-semibold text-neutral-50">
              {site.name}
            </span>
          </Link>
          <Link
            to="/"
            className="text-sm text-neutral-400 transition-colors hover:text-neutral-100"
          >
            Back to home
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center px-6 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

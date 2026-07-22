import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { cn } from "@utils/index";

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6 lg:px-8"
    >
      <nav className={cn(
        "mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl border px-4 transition-all duration-500 sm:px-6",
        scrolled
          ? "border-white/10 bg-background/80 shadow-xl shadow-black/30 backdrop-blur-2xl"
          : "border-white/5 bg-white/3 backdrop-blur-md"
      )}>
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/40">
            <span className="font-heading text-sm font-bold text-white">D</span>
          </div>
          <span className="font-heading text-base font-semibold text-white">DevCanvas</span>
        </Link>

        {/* Center nav — pill */}
        <div className="hidden items-center gap-0.5 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href}
              className="rounded-xl px-3.5 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/8 hover:text-white">
              {link.label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Link to="/sign-in"
            className="rounded-xl px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/8 hover:text-white">
            Sign in
          </Link>
          <Link to="/sign-up"
            className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-white/90">
            Get started
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-white/70 hover:bg-white/8 md:hidden"
          aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open ? (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-background/95 p-4 backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/70 hover:bg-white/8 hover:text-white">
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
            <Link to="/sign-in" onClick={() => setOpen(false)}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-center text-sm font-medium text-white/70">
              Sign in
            </Link>
            <Link to="/sign-up" onClick={() => setOpen(false)}
              className="rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-black">
              Get started
            </Link>
          </div>
        </motion.div>
      ) : null}
    </motion.header>
  );
}

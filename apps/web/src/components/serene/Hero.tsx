import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function Hero() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleSound = () => {
    setIsMuted((prev) => !prev);
  };

  const navLinks = ["About", "Services", "Journal", "Contact"];

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#0a0608] flex items-center justify-center font-inter select-none">
      {/* ── 1. Background Video ── */}
      <video
        ref={videoRef}
        autoPlay
        muted={isMuted}
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260613_180732_a54afbf6-b30d-470e-861f-669871f09f67.mp4"
      />

      {/* ── 2. Dark Overlay ── */}
      <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none" />

      {/* ── 3. Fixed Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 backdrop-blur-[2px]">
        {/* Left: Brand Logo */}
        <a href="#hero" className="text-white text-2xl md:text-3xl font-dancing font-bold tracking-wide">
          Serene
        </a>

        {/* Center: Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-12">
          {navLinks.map((link, idx) => (
            <a
              key={idx}
              href={`#${link.toLowerCase()}`}
              className="text-white/80 hover:text-white text-sm tracking-wide transition-colors duration-300 font-medium"
            >
              {link}
            </a>
          ))}
        </div>

        {/* Right: Desktop CTA Button */}
        <div className="hidden md:block">
          <button className="bg-white text-black px-8 py-3.5 rounded-full font-medium text-sm tracking-wide hover:bg-white/90 transition-all duration-300 button-glow cursor-pointer">
            Book a consultation
          </button>
        </div>

        {/* Right: Mobile Hamburger Icon */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden relative z-50 w-8 h-8 flex flex-col justify-between py-1.5 px-0.5 cursor-pointer focus:outline-none"
          aria-label="Toggle Menu"
        >
          <span
            className={`w-full h-[2px] bg-white rounded-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              mobileMenuOpen ? "rotate-45 translate-y-[9px]" : ""
            }`}
          />
          <span
            className={`w-full h-[2px] bg-white rounded-full transition-all duration-300 ${
              mobileMenuOpen ? "opacity-0 scale-0" : "opacity-100"
            }`}
          />
          <span
            className={`w-full h-[2px] bg-white rounded-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              mobileMenuOpen ? "-rotate-45 -translate-y-[9px]" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile Menu Slide-in Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-40 w-[85%] max-w-[340px] bg-[#0a0608]/95 backdrop-blur-xl border-l border-white/10 p-8 pt-28 flex flex-col justify-between transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-6">
          {navLinks.map((link, idx) => (
            <a
              key={idx}
              href={`#${link.toLowerCase()}`}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                transitionDelay: mobileMenuOpen ? `${150 + idx * 75}ms` : "0ms",
              }}
              className={`text-white/90 hover:text-white text-xl font-instrument italic tracking-wide transition-all duration-500 ${
                mobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
              }`}
            >
              {link}
            </a>
          ))}
        </div>

        <div
          style={{ transitionDelay: mobileMenuOpen ? "450ms" : "0ms" }}
          className={`transition-all duration-500 ${
            mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-full bg-white text-black py-4 rounded-full font-medium text-sm tracking-wide hover:bg-white/90 transition-all duration-300 button-glow cursor-pointer text-center"
          >
            Book a consultation
          </button>
        </div>
      </div>

      {/* Backdrop overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      {/* ── 4. Center Content ── */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-6 max-w-5xl -mt-[120px]">
        <h1 className="font-instrument italic text-white text-[36px] sm:text-6xl md:text-7xl lg:text-[110px] leading-[0.9] tracking-tight text-glow select-none">
          Gentle touch. Radiant presence.
        </h1>
        <p className="text-white/70 text-sm md:text-base text-center mt-5 md:mt-7 max-w-xl font-normal leading-relaxed">
          Expert beauty and holistic wellness, delivered with warmth and intention.
        </p>
        <button className="mt-6 md:mt-9 bg-white text-black px-8 py-3.5 rounded-full font-medium text-sm tracking-wide hover:bg-white/90 transition-all duration-300 button-glow cursor-pointer">
          Begin your renewal
        </button>
      </div>

      {/* ── 5. Sound Indicator (Desktop Only) ── */}
      <div
        onClick={toggleSound}
        className="hidden md:flex items-center gap-3 absolute bottom-8 left-8 z-20 cursor-pointer group"
      >
        <div className="w-10 h-10 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center text-white/80 group-hover:border-white/50 group-hover:text-white transition-all duration-300">
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
          ) : (
            <div className="flex items-center gap-[3px] h-3">
              <span className="w-[2px] h-full bg-white animate-pulse" />
              <span className="w-[2px] h-2 bg-white animate-pulse delay-75" />
              <span className="w-[2px] h-3 bg-white animate-pulse delay-150" />
            </div>
          )}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-white/60 text-xs leading-none group-hover:text-white/80 transition-colors">
            Experience
          </span>
          <span className="text-white/60 text-xs leading-tight font-medium group-hover:text-white transition-colors">
            {isMuted ? "with sound" : "playing sound"}
          </span>
        </div>
      </div>
    </section>
  );
}

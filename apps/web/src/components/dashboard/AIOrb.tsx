import { motion } from "framer-motion";

export function AIOrb({ scale = 1 }: { scale?: number }) {
  return (
    <div className="relative flex items-center justify-center" style={{ transform: `scale(${scale})`, transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
      {/* Background radial glow */}
      <div className="absolute h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 opacity-25 blur-[64px] animate-pulse pointer-events-none" />
      
      {/* SVG Container with Gooey filter definition */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="ai-orb-gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Glass-like liquid blob container */}
      <div
        className="relative h-48 w-48 rounded-full flex items-center justify-center shadow-[inset_0_1px_3px_rgba(255,255,255,0.4)]"
        style={{
          filter: "url(#ai-orb-gooey)",
          background: "rgba(255, 255, 255, 0.02)",
          backdropFilter: "blur(4px)",
        }}
      >
        {/* Center core blob */}
        <motion.div
          animate={{
            scale: [1, 1.08, 0.95, 1.02, 1],
            borderRadius: [
              "42% 58% 70% 30% / 45% 45% 55% 55%",
              "70% 30% 52% 48% / 60% 40% 60% 40%",
              "45% 55% 40% 60% / 50% 60% 40% 50%",
              "58% 42% 65% 35% / 45% 55% 45% 55%",
              "42% 58% 70% 30% / 45% 45% 55% 55%",
            ],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute h-36 w-36 bg-gradient-to-tr from-indigo-500/80 via-purple-600/70 to-pink-500/60 shadow-[0_0_30px_rgba(99,102,241,0.5),inset_0_4px_20px_rgba(255,255,255,0.2)]"
        />

        {/* Satellite Blob 1 (Cyan/Green Glow) */}
        <motion.div
          animate={{
            x: [-24, 28, -12, -24],
            y: [12, -28, 20, 12],
            scale: [0.8, 1.1, 0.9, 0.8],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute h-16 w-16 rounded-full bg-gradient-to-tr from-cyan-400/80 to-blue-500/70 opacity-90 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
        />

        {/* Satellite Blob 2 (Magenta/Purple Glow) */}
        <motion.div
          animate={{
            x: [32, -32, 16, 32],
            y: [-16, 20, -28, -16],
            scale: [0.9, 0.75, 1.05, 0.9],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute h-14 w-14 rounded-full bg-gradient-to-tr from-purple-500/80 to-fuchsia-500/70 opacity-90 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
        />

        {/* Satellite Blob 3 (Floating glow detail) */}
        <motion.div
          animate={{
            x: [-10, 15, -25, -10],
            y: [30, -15, -20, 30],
            scale: [0.7, 0.95, 0.8, 0.7],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute h-12 w-12 rounded-full bg-gradient-to-tr from-violet-600/70 to-indigo-400/60 opacity-80"
        />
      </div>

      {/* Overlaid highlight reflection for standard glass finish */}
      <div className="absolute pointer-events-none h-44 w-44 rounded-full border border-white/10 opacity-30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]" />
    </div>
  );
}

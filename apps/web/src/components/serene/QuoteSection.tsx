import { useEffect, useRef } from "react";

export function QuoteSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const rainbowRef = useRef<HTMLImageElement>(null);
  const leftCloudRef = useRef<HTMLImageElement>(null);
  const rightCloudRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    // Current animated state
    let rainbowY = 120;

    let leftCloudX = -200;
    let leftCloudY = 0;
    let leftOpacity = 0;

    let rightCloudX = 200;
    let rightCloudY = 0;
    let rightOpacity = 0;

    const lerp = (current: number, target: number, factor: number) =>
      current + (target - current) * factor;

    const updateParallax = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate scroll progress through viewport (0 to 1)
      const rawProgress = (windowHeight - rect.top) / (windowHeight + rect.height);
      const progress = Math.max(0, Math.min(1, rawProgress));

      // Target calculations
      // 1. Rainbow moves vertically from +120px to -160px
      const targetRainbowY = 120 - progress * 280;
      rainbowY = lerp(rainbowY, targetRainbowY, 0.06);

      // 2. Cloud visibility & position
      const inView = progress >= 0.12 && progress <= 0.92;
      const targetLeftX = inView ? 0 : -200;
      const targetRightX = inView ? 0 : 200;
      const targetCloudY = progress * -50;
      const targetOpacity = inView ? 1 : 0;

      leftCloudX = lerp(leftCloudX, targetLeftX, 0.04);
      leftCloudY = lerp(leftCloudY, targetCloudY, 0.04);
      leftOpacity = lerp(leftOpacity, targetOpacity, 0.04);

      rightCloudX = lerp(rightCloudX, targetRightX, 0.04);
      rightCloudY = lerp(rightCloudY, targetCloudY, 0.04);
      rightOpacity = lerp(rightOpacity, targetOpacity, 0.04);

      // Apply transforms with translate3d
      if (rainbowRef.current) {
        rainbowRef.current.style.transform = `translate3d(0, ${rainbowY}px, 0)`;
      }

      if (leftCloudRef.current) {
        leftCloudRef.current.style.transform = `translate3d(${leftCloudX}px, ${leftCloudY}px, 0)`;
        leftCloudRef.current.style.opacity = `${leftOpacity}`;
      }

      if (rightCloudRef.current) {
        rightCloudRef.current.style.transform = `translate3d(${rightCloudX}px, ${rightCloudY}px, 0) scaleX(-1)`;
        rightCloudRef.current.style.opacity = `${rightOpacity}`;
      }

      animationFrameId = requestAnimationFrame(updateParallax);
    };

    animationFrameId = requestAnimationFrame(updateParallax);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden flex items-center justify-center px-6 md:px-12 select-none font-inter"
      style={{
        background:
          "linear-gradient(to bottom, #010A17 0%, #0A4267 30%, #20658E 60%, #6BADC4 100%)",
      }}
    >
      {/* ── 1. Rainbow Layer ── */}
      <img
        ref={rainbowRef}
        src="https://soft-zoom-63098134.figma.site/_assets/v11/8d520a7515d06cbfc403d0125e3d05b1a7ccd29c.png"
        alt="Serene Rainbow Aura"
        className="absolute inset-x-0 top-0 z-30 pointer-events-none w-full object-cover opacity-90 will-change-transform"
      />

      {/* ── 2. Left Cloud ── */}
      <img
        ref={leftCloudRef}
        src="https://soft-zoom-63098134.figma.site/_assets/v11/0d6dfd3f90b930f21726f2ed56a3320d79b7a797.png"
        alt="Serene Left Cloud"
        className="absolute left-0 bottom-[10%] z-10 hidden sm:block w-[500px] md:w-[650px] pointer-events-none opacity-0 will-change-transform"
        style={{ marginLeft: "-50%" }}
      />

      {/* ── 3. Right Cloud (Flipped) ── */}
      <img
        ref={rightCloudRef}
        src="https://soft-zoom-63098134.figma.site/_assets/v11/0d6dfd3f90b930f21726f2ed56a3320d79b7a797.png"
        alt="Serene Right Cloud"
        className="absolute right-0 bottom-[15%] z-10 hidden sm:block w-[500px] md:w-[650px] pointer-events-none opacity-0 will-change-transform"
        style={{ marginRight: "-75%" }}
      />

      {/* ── 4. Quote Content ── */}
      <div className="relative z-20 max-w-4xl text-center px-4 md:px-8">
        <blockquote className="font-instrument italic text-white text-xl sm:text-2xl md:text-4xl lg:text-[42px] leading-[1.45] md:leading-[1.5] text-glow select-none">
          “Serene was founded on a belief in beauty that honors your nature. We
          pursue refined outcomes, considered approaches, and lasting vitality.
          We spend time learning what matters to you before deciding what
          serves you best. No rushing, no excess -- just support that lets you
          feel radiant.”
        </blockquote>
        <p className="mt-6 md:mt-8 text-white/80 text-sm md:text-base tracking-wide font-normal">
          Dr. Mia Callahan -- Founder
        </p>
      </div>
    </section>
  );
}

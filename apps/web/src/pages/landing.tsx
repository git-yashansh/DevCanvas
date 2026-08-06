import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { LandingBackground } from "@/components/landing/landing-background";
import Beams from "@/components/landing/Beams";
import PrismaticBurst from "@/components/landing/PrismaticBurst";

export function LandingPage() {
  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutQuart
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0">
        <LandingBackground />
      </div>
      <div className="relative z-10">
        <Navbar />
        <main>
          <Hero />
          <Features />

          {/* Grouped section with Beams background */}
          <div className="relative overflow-hidden">
            {/* Beams Canvas Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <Beams
                beamWidth={2.5}
                beamHeight={22}
                beamNumber={14}
                lightColor="#ffffff"
                speed={1.5}
                noiseIntensity={1.6}
                scale={0.18}
                rotation={8}
              />
              {/* Edge blending vertical gradient to transition smoothly from Features and into Pricing */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#06040f] via-transparent to-[#06040f] opacity-80" />
            </div>
            {/* Content layer */}
            <div className="relative z-10">
              <HowItWorks />
              <Testimonials />
            </div>
          </div>

          {/* Grouped section with PrismaticBurst background */}
          <div className="relative overflow-hidden">
            {/* PrismaticBurst Canvas Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <PrismaticBurst
                intensity={1.8}
                distort={0.8}
                rayCount={20}
                mixBlendMode="lighten"
                colors={["#ff007a", "#4d3dff", "#ffffff"]}
              />
              {/* Edge blending vertical gradient to transition smoothly */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#06040f] via-transparent to-[#06040f]" />
            </div>
            {/* Content layer */}
            <div className="relative z-10">
              <Pricing />
              <FAQ />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}


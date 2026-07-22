import { type ReactNode, useRef, useEffect } from "react";
import gsap from "gsap";
import { cn } from "@utils/index";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!wordsRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const words = wordsRef.current.querySelectorAll(".hero-word");
    if (words && words.length > 0) {
      gsap.fromTo(
        words,
        { opacity: 0, y: 20, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.15,
        }
      );
    }
  }, [title]);

  const words = title.split(" ");

  return (
    <div
      ref={headerRef}
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}
    >
      <div>
        <h1
          ref={wordsRef}
          className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight leading-tight"
        >
          {words.map((word, i) => (
            <span
              key={i}
              className="hero-word inline-block mr-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-purple-200"
            >
              {word}
            </span>
          ))}
        </h1>
        {description ? (
          <p className="mt-1.5 text-sm font-medium text-white/40">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

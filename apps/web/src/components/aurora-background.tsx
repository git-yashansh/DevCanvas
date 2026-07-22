import { cn } from "@utils/index";

export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div
        className="aurora-blob animate-aurora"
        style={{
          top: "-10%",
          left: "-5%",
          width: "40rem",
          height: "40rem",
          background:
            "radial-gradient(circle, var(--color-primary-500), transparent 70%)",
        }}
      />
      <div
        className="aurora-blob animate-aurora"
        style={{
          top: "20%",
          right: "-10%",
          width: "35rem",
          height: "35rem",
          background:
            "radial-gradient(circle, var(--color-secondary-500), transparent 70%)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="aurora-blob animate-aurora"
        style={{
          bottom: "-15%",
          left: "30%",
          width: "45rem",
          height: "45rem",
          background:
            "radial-gradient(circle, var(--color-accent-500), transparent 70%)",
          animationDelay: "-12s",
        }}
      />
    </div>
  );
}

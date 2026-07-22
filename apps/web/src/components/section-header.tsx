import { type ReactNode } from "react";
import { cn } from "@utils/index";

interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  align?: "left" | "center";
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
  align = "center",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? (
        <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary-300">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="max-w-3xl font-heading text-3xl font-semibold tracking-tight text-neutral-50 sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-base text-neutral-400 sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

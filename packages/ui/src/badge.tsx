import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@utils/index";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-500/15 text-primary-300",
        secondary: "border-transparent bg-secondary-500/15 text-secondary-300",
        accent: "border-transparent bg-accent-500/15 text-accent-300",
        success: "border-transparent bg-success-500/15 text-success-300",
        warning: "border-transparent bg-warning-500/15 text-warning-300",
        danger: "border-transparent bg-danger-500/15 text-danger-300",
        outline: "border-border text-neutral-300",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "border-border bg-secondary text-secondary-foreground",
        accent: "border-transparent bg-primary/15 text-primary",
        warning:
          "border-transparent bg-[color:var(--pdi-warning)]/15 text-[color:var(--pdi-warning)]",
        danger: "border-transparent bg-destructive/15 text-destructive",
        success:
          "border-transparent bg-[color:var(--pdi-success)]/15 text-[color:var(--pdi-success)]",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

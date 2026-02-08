import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export default function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white/72 backdrop-blur-md shadow-card ring-1 ring-gainsboro/60",
        "transition-shadow",
        className,
      )}
      {...props}
    />
  );
}

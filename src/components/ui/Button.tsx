import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type Variant = "primary" | "secondary" | "quiet";
type Size = "sm" | "md";

export default function Button({
  className,
  variant = "secondary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm",
        "ring-1 ring-gainsboro/55 transition",
        "disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" ? "px-2.5 py-1.5 text-xs" : "",
        variant === "primary"
          ? "bg-camel text-white shadow-sm hover:brightness-[0.98]"
          : variant === "quiet"
            ? "bg-transparent text-outer-space/80 hover:bg-white/60"
            : "bg-white/70 text-outer-space hover:bg-white/80",
        className,
      )}
      {...props}
    />
  );
}

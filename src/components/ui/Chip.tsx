import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export default function Chip({
  className,
  selected,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs ring-1 transition",
        selected
          ? "bg-outer-space text-white ring-outer-space/40"
          : "bg-mint-cream text-outer-space/80 ring-gainsboro/70 hover:bg-white",
        className,
      )}
      {...props}
    />
  );
}


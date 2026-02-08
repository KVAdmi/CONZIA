import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export default function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl bg-white/70 px-3 py-2 text-sm text-outer-space backdrop-blur",
        "ring-1 ring-gainsboro/60 placeholder:text-outer-space/45",
        "disabled:opacity-60 disabled:bg-mint-cream/50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-2 focus:ring-camel/35",
        className,
      )}
      {...props}
    />
  );
}

import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export function FieldLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-xs font-medium text-outer-space/80", className)}
      {...props}
    />
  );
}

export function FieldHint({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-xs text-outer-space/60", className)} {...props} />;
}


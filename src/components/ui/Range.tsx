import { cn } from "../../utils/cn";

export default function Range({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  className,
  ariaLabel,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  ariaLabel: string;
}) {
  return (
    <input
      className={cn(
        "h-2 w-full cursor-pointer appearance-none rounded-full bg-gainsboro/80",
        "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-camel [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-white",
        "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-camel [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white",
        className,
      )}
      aria-label={ariaLabel}
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}


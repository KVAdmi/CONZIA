import { cn } from "../../utils/cn";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export default function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (next: T) => void;
  options: Array<SegmentedOption<T>>;
  ariaLabel: string;
}) {
  return (
    <div className="inline-flex rounded-xl bg-white/55 p-1 ring-1 ring-gainsboro/60 backdrop-blur">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs transition",
              active ? "bg-white/85 text-outer-space shadow-sm" : "text-outer-space/70 hover:text-outer-space",
            )}
            aria-label={`${ariaLabel}: ${opt.label}`}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

import { cn } from "../../utils/cn";

export default function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3 text-left",
        "ring-1 ring-gainsboro/60 transition",
        checked ? "bg-white/80" : "bg-white/60 hover:bg-white/70",
      )}
      aria-pressed={checked}
    >
      <div>
        <div className="text-sm font-medium text-outer-space">{label}</div>
        {description ? (
          <div className="mt-1 text-sm text-outer-space/70">{description}</div>
        ) : null}
      </div>
      <span
        aria-hidden
        className={cn(
          "h-6 w-10 rounded-full p-0.5 ring-1 ring-gainsboro/60 transition",
          checked ? "bg-outer-space/80" : "bg-gainsboro/60",
        )}
      >
        <span
          className={cn(
            "block h-5 w-5 rounded-full bg-white transition",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}

import { ArrowRight } from "lucide-react";

type Props = {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
  variant?: "info" | "warning" | "urgent";
};

/**
 * CTA contextual que explica el siguiente paso
 */
export default function NextStepCTA({ title, message, actionLabel, onAction, variant = "info" }: Props) {
  const variantStyles = {
    info: "from-white/8 to-white/4 ring-white/12",
    warning: "from-amber-500/10 to-amber-500/5 ring-amber-500/20",
    urgent: "from-red-500/10 to-red-500/5 ring-red-500/20",
  };

  return (
    <div
      className={`
        rounded-2xl bg-gradient-to-br backdrop-blur-xl
        ring-1 p-5
        shadow-[0_12px_40px_rgba(0,0,0,0.25)]
        ${variantStyles[variant]}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="text-xs tracking-wider text-white/50 uppercase mb-1">Tu próximo paso</div>
          <div className="text-base font-semibold text-white mb-2">{title}</div>
          <div className="text-sm text-white/70 leading-relaxed">{message}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={onAction}
        className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-camel px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition hover:bg-camel/90 active:scale-[0.98]"
      >
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

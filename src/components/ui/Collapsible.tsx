import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "../../utils/cn";

export default function Collapsible({
  title,
  description,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
  className,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = useMemo(() => {
    return (next: boolean) => {
      if (controlledOpen === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    };
  }, [controlledOpen, onOpenChange]);

  return (
    <div className={cn("rounded-2xl bg-white/72 backdrop-blur-md ring-1 ring-gainsboro/60 overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 text-left transition hover:bg-white/60"
        aria-expanded={open}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold tracking-tight text-outer-space">{title}</div>
            {description ? (
              <div className="mt-1 text-sm text-outer-space/70">{description}</div>
            ) : null}
          </div>
          <ChevronDown
            className={cn(
              "mt-0.5 h-4 w-4 text-outer-space/60 transition-transform",
              open ? "rotate-180" : "",
            )}
            aria-hidden
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="border-t border-gainsboro/60"
          >
            <div className="px-5 py-5">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

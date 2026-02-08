import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "../../utils/cn";

export default function GlassSheet({
  open,
  title,
  description,
  onClose,
  children,
  className,
  zIndexClassName = "z-50",
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  zIndexClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="glass-sheet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn("fixed inset-0", zIndexClassName)}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            aria-label="Cerrar"
          />

          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={cn("absolute inset-x-0 bottom-0 mx-auto w-[min(520px,100%)] px-4 pb-5", className)}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="rounded-[34px] bg-[#0b1220]/78 ring-1 ring-white/10 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)] overflow-hidden">
              <div className="flex items-center justify-center px-6 pt-3">
                <div className="h-1 w-12 rounded-full bg-white/25" aria-hidden />
              </div>

              <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold tracking-tight text-white">{title}</div>
                  {description ? (
                    <div className="mt-1 text-xs text-white/65">{description}</div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-2xl p-2 text-white/75 ring-1 ring-white/15 transition hover:bg-white/10 hover:text-white"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="max-h-[70svh] overflow-auto px-6 pb-6">{children}</div>
              <div className="h-4" />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}


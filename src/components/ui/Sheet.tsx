import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "../../utils/cn";

export default function Sheet({
  open,
  title,
  description,
  onClose,
  children,
  className,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
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
          key="sheet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute inset-0 bg-outer-space/40"
            aria-label="Cerrar"
          />

          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "absolute inset-x-0 bottom-0 mx-auto w-[min(720px,100%)]",
              className,
            )}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="rounded-t-2xl bg-white/82 backdrop-blur-md shadow-card ring-1 ring-gainsboro/60 overflow-hidden">
              <div className="flex items-start justify-between gap-4 border-b border-gainsboro/60 px-5 py-4">
                <div>
                  <div className="text-sm font-semibold tracking-tight text-outer-space">{title}</div>
                  {description ? (
                    <div className="mt-1 text-xs text-outer-space/70">{description}</div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl p-2 text-outer-space/70 ring-1 ring-gainsboro/60 transition hover:bg-white/60 hover:text-outer-space"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-auto px-5 py-5">{children}</div>
              <div className="h-6" />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

import { useEffect, useRef } from "react";

/**
 * Right-hand editing drawer.
 *
 * Handles the modal chores so each admin screen doesn't repeat them: body
 * scroll lock, Escape to dismiss, initial focus, and focus restored to whatever
 * opened it. Rendered inline rather than through a portal — the admin layout
 * has no stacking contexts that would trap it.
 */
export default function Drawer({ open, title, description, onClose, children, footer }) {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    // Focus the first control so keyboard users land inside the form.
    const focusTarget = panelRef.current?.querySelector(
      "input, textarea, select, button",
    );
    focusTarget?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close editor"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/75 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#0a0a0a] shadow-2xl"
      >
        <header className="flex items-start justify-between gap-6 border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-white/45">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 border border-white/10 px-3 py-1.5 text-sm text-white/60 transition-colors hover:border-white/30 hover:text-white"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

        {footer ? (
          <footer className="border-t border-white/10 px-6 py-4">{footer}</footer>
        ) : null}
      </div>
    </div>
  );
}

import { useEffect } from "react";

const TONE_STYLES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-700",
};

const TONE_ROLES = {
  success: "status",
  error: "alert",
};

export default function Toast({
  message,
  tone = "success",
  onClose,
  duration = 4000,
  actionLabel,
  onAction,
}) {
  useEffect(() => {
    if (!message || !duration) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, tone, duration, onClose]);

  if (!message) {
    return null;
  }

  const role = TONE_ROLES[tone] ?? TONE_ROLES.success;
  const toneClass = TONE_STYLES[tone] ?? TONE_STYLES.success;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
      <div
        role={role}
        aria-live={tone === "error" ? "assertive" : "polite"}
        className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${toneClass}`}
      >
        <span className="flex-1">{message}</span>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 rounded-md border border-current px-2 py-0.5 text-xs font-semibold opacity-80 transition hover:opacity-100"
          >
            {actionLabel}
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss notification"
            className="-mr-1 shrink-0 rounded-md px-1.5 text-lg leading-none opacity-70 transition hover:opacity-100"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

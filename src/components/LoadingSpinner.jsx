import { LoadingIcon } from "./Icon";

export default function LoadingSpinner() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#050505]"
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <LoadingIcon style="h-8 w-8 animate-spin text-[#ff4d1c] mx-auto" />
        <p className="mt-4 font-mono text-[0.6875rem] tracking-[0.2em] text-white/40 uppercase">
          Loading
        </p>
      </div>
    </div>
  );
}

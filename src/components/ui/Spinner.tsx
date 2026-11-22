export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <span
      role="status"
      aria-label="불러오는 중"
      className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
      style={{ width: size, height: size }}
    />
  );
}

export function FullscreenSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-gold-400">
      <Spinner size={32} />
    </div>
  );
}

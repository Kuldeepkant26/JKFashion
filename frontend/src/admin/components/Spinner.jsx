/**
 * Loading indicator. `label` is announced to screen readers and shown as text
 * so a slow response reads as progress rather than a frozen screen.
 */
export default function Spinner({ label = 'Loading', className = '' }) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`} role="status">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-brand-pink/25
                   border-t-brand-pink"
        aria-hidden="true"
      />
      <span className="font-body text-sm text-brand-ink/55">{label}</span>
    </div>
  );
}

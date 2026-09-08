/**
 * The success/error line, so all three settings tabs report identically.
 *
 * Both are rendered from one component because they are mutually exclusive in
 * practice — a save either flashed a confirmation or set an error — and
 * keeping them together stops a tab from wiring up one but not the other.
 */
export default function SettingsStatus({ note, error }) {
  return (
    <>
      {note ? (
        <p role="status" className="text-sm font-semibold text-emerald-600">
          {note}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </>
  );
}

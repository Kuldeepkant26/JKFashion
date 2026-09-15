/**
 * The editing affordances shared by the WYSIWYG settings tabs.
 *
 * The `pt-` prefix is kept rather than renamed to something neutral: the class
 * names are load-bearing across ProcessTab.css and renaming them would mean
 * touching hundreds of lines for no functional gain. Read it as "page tools".
 */

/** The small floating toolbar that appears on a hovered element. */
export function Tools({ children, label }) {
  return (
    <div className="pt-tools" role="group" aria-label={label}>
      {children}
    </div>
  );
}

export function ToolButton({ onClick, disabled, title, danger, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`pt-tool ${danger ? 'pt-tool-danger' : ''}`}
    >
      {children}
    </button>
  );
}

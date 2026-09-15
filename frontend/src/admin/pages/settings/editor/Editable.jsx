import { useEffect, useRef, useState } from 'react';

/**
 * A span of the real design that can be typed into.
 *
 * contentEditable rather than an <input> because the text has to keep the
 * section's own typography — an input would impose its own box model, and the
 * whole point of these tabs is that what you edit is what you get.
 *
 * The value is written to the DOM only when it changes from OUTSIDE (a fresh
 * fetch), never on every keystroke: re-rendering a focused contentEditable
 * from state resets the caret to position zero on every character typed.
 */
export default function Editable({
  value,
  onCommit,
  placeholder,
  as: Tag = 'span',
  className = '',
  multiline,
}) {
  const ref = useRef(null);
  const [empty, setEmpty] = useState(!value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Skip while focused, or typing would fight the caret.
    if (document.activeElement === el) return;
    if (el.textContent !== (value ?? '')) el.textContent = value ?? '';
    setEmpty(!value);
  }, [value]);

  const commit = () => {
    const next = (ref.current?.textContent ?? '').replace(/\s+/g, ' ').trim();
    setEmpty(!next);
    if (next !== (value ?? '')) onCommit(next);
  };

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      tabIndex={0}
      aria-label={placeholder}
      data-placeholder={placeholder}
      className={`pt-editable ${empty ? 'pt-editable-empty' : ''} ${className}`}
      onInput={() => setEmpty(!ref.current?.textContent)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !multiline) {
          e.preventDefault();
          ref.current?.blur();
        }
        if (e.key === 'Escape') {
          if (ref.current) ref.current.textContent = value ?? '';
          ref.current?.blur();
        }
      }}
    />
  );
}

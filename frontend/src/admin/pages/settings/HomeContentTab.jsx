import { useCallback, useEffect, useRef, useState } from 'react';
import { FiUploadCloud, FiTrash2 } from 'react-icons/fi';
import * as homeApi from '../../../api/home.api.js';
import Spinner from '../../components/Spinner.jsx';
import SettingsStatus from './SettingsStatus.jsx';
import SaveBar from './SaveBar.jsx';
import { hero as heroImages } from '../../../data/images.js';

/*
 * Plain Tailwind, and deliberately NOT the website's own stylesheet.
 *
 * An earlier version imported css/Home.css so the preview would be pixel-exact.
 * That stylesheet scopes every hero rule to `.home-page` and sets the section
 * to min-height:100vh with absolutely-positioned artwork — dropped into the
 * admin panel it fought the panel's own layout. A simple, honest editor beats
 * a faithful preview that breaks the page around it.
 */

/** Mirrors the API's own caps, so an oversized file is caught before upload. */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';

/** The text fields, in the order they appear in the hero. */
const FIELDS = [
  {
    name: 'eyebrow',
    label: 'Small line above the heading',
    placeholder: 'TIME TO MEET YOUR',
  },
  { name: 'title', label: 'Heading', placeholder: 'COLOUR & YARN' },
  {
    name: 'description',
    label: 'Description',
    placeholder: 'A sentence or two about what you make',
    textarea: true,
  },
  { name: 'ctaLabel', label: 'Button text', placeholder: 'View Our Work' },
  {
    name: 'imageAlt',
    label: 'Image description',
    placeholder: 'Describes the picture for screen readers',
  },
];

const inputClass =
  'w-full rounded-xl bg-surface-card px-3.5 py-2.5 font-body text-sm text-brand-ink ' +
  'ring-1 ring-brand-ink/12 transition-shadow placeholder:text-brand-ink/35 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-pink';

export default function HomeContentTab() {
  /** What the server has. */
  const [saved, setSaved] = useState(null);
  /** What the form shows. Diverges from `saved` once the owner types. */
  const [draft, setDraft] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const fileRef = useRef(null);

  const flash = (message) => {
    setNote(message);
    setTimeout(() => setNote(''), 2500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await homeApi.get();
      setSaved(data.hero);
      setDraft(data.hero);
      setError('');
    } catch (err) {
      setError(err?.message ?? 'Could not load the hero content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /*
   * Text is saved on Save, not per keystroke: the owner should be able to
   * rewrite a headline, change their mind and discard it. The image is the
   * exception — an upload is a deliberate act with an obvious result, and
   * holding the file until Save would mean either a blob preview or a picture
   * that does not match the fields around it.
   */
  const dirty =
    !!draft &&
    !!saved &&
    FIELDS.some((f) => (draft[f.name] ?? '') !== (saved[f.name] ?? ''));

  const setField = (name, value) => setDraft((d) => ({ ...d, [name]: value }));

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const patch = Object.fromEntries(FIELDS.map((f) => [f.name, draft[f.name] ?? '']));
      const data = await homeApi.updateSection({ hero: patch });
      setSaved(data.hero);
      setDraft(data.hero);
      flash('Saved');
    } catch (err) {
      setError(err?.message ?? 'That did not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async (file) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setError('That image is larger than 8MB. Please choose a smaller file.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const data = await homeApi.setHeroImage(file);
      setSaved(data.hero);
      // Keep whatever the owner is part-way through typing; take only the image.
      setDraft((d) => ({ ...d, image: data.hero.image }));
      flash('Image updated');
    } catch (err) {
      setError(err?.message ?? 'That image did not upload. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    if (!window.confirm('Remove this image? The built-in one comes back.')) return;

    setUploading(true);
    setError('');
    try {
      const data = await homeApi.clearHeroImage();
      setSaved(data.hero);
      setDraft((d) => ({ ...d, image: data.hero.image }));
      flash('Image removed');
    } catch (err) {
      setError(err?.message ?? 'That did not save. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading || !draft) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner label="Loading hero content" />
      </div>
    );
  }

  const imageSrc = draft.image?.url || heroImages.showcase[2];
  const hasOwnImage = Boolean(draft.image?.url);

  return (
    <div className="flex flex-col gap-6">
      <SettingsStatus note={note} error={error} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        {/* ------------------------------------------------------------ text */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-brand-ink">Hero text</h2>
            <p className="mt-0.5 font-body text-sm text-brand-ink/55">
              The words on the left of your home page.
            </p>
          </div>

          {FIELDS.map((field) => (
            <label key={field.name} className="flex flex-col gap-1.5">
              <span className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
                {field.label}
              </span>

              {field.textarea ? (
                <textarea
                  rows={4}
                  className={`${inputClass} resize-y leading-relaxed`}
                  value={draft[field.name] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(e) => setField(field.name, e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  className={inputClass}
                  value={draft[field.name] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(e) => setField(field.name, e.target.value)}
                />
              )}
            </label>
          ))}
        </div>

        {/* ----------------------------------------------------------- image */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-brand-ink">Hero image</h2>
            <p className="mt-0.5 font-body text-sm text-brand-ink/55">
              The picture on the right. Click it to change.
            </p>
          </div>

          {/* The picture IS the button — clicking what you want to change is
              the whole ask, so there is no separate upload control. */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Change hero image"
            className="group relative grid aspect-[3/4] w-full place-items-center overflow-hidden
                       rounded-2xl bg-admin-cream ring-1 ring-brand-ink/12 transition-shadow
                       hover:ring-2 hover:ring-brand-pink focus-visible:outline-2
                       focus-visible:outline-offset-2 focus-visible:outline-brand-pink
                       disabled:cursor-wait"
          >
            <img
              src={imageSrc}
              alt={draft.imageAlt || 'Hero image'}
              className="h-full w-full object-contain p-3"
            />

            {/* Hidden until hover or keyboard focus, so the picture reads as the
                content it is rather than as a form control. */}
            <span
              className={`absolute inset-0 flex flex-col items-center justify-center gap-2
                          bg-brand-ink/60 font-body text-sm font-semibold text-white
                          transition-opacity
                          ${
                            uploading
                              ? 'opacity-100'
                              : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                          }`}
            >
              {uploading ? (
                <Spinner label="Uploading" className="h-5 w-5" />
              ) : (
                <>
                  <FiUploadCloud aria-hidden className="h-6 w-6" />
                  Click to change
                </>
              )}
            </span>
          </button>

          {hasOwnImage ? (
            <button
              type="button"
              onClick={removeImage}
              disabled={uploading}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5
                         font-body text-sm font-semibold text-rose-700 ring-1 ring-rose-200
                         transition-colors hover:bg-rose-50 focus-visible:outline-2
                         focus-visible:outline-offset-2 focus-visible:outline-brand-pink
                         disabled:opacity-60"
            >
              <FiTrash2 aria-hidden /> Remove image
            </button>
          ) : (
            <p className="font-body text-xs text-brand-ink/50">
              Currently using the built-in picture.
            </p>
          )}

          <p className="font-body text-xs leading-relaxed text-brand-ink/50">
            A cut-out PNG with a transparent background works best. JPEG, PNG, WebP or AVIF,
            up to 8MB. The image saves as soon as you pick it.
          </p>
        </div>
      </div>

      {dirty ? (
        <SaveBar
          summary="You have unsaved changes to the hero text."
          saving={saving}
          onDiscard={() => setDraft(saved)}
          onSave={save}
        />
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          pickImage(e.target.files?.[0]);
          // Reset so re-picking the same file fires change again.
          e.target.value = '';
        }}
      />
    </div>
  );
}

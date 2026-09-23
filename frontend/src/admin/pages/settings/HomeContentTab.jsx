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

/**
 * The business details, in the order they read in the footer.
 *
 * These show in four places at once — the footer, the navbar strip, the mobile
 * menu and the enquiry block — so the hints say so: an owner changing a phone
 * number should know it is not just one line on one page.
 *
 * Leaving one blank is a supported choice, not an incomplete form: the site
 * omits the line entirely rather than printing an empty one. That is how the
 * email stays hidden until there is an address to publish.
 */
const CONTACT_FIELDS = [
  {
    name: 'phone',
    label: 'Phone number',
    placeholder: '9810014413',
    hint: 'Shown in the footer, the menu and the enquiry section. Type it the way you want visitors to read it.',
  },
  {
    name: 'address',
    label: 'Address',
    placeholder: 'Faridabad, Haryana India',
    hint: 'Shown under the phone number in the footer.',
  },
  {
    name: 'email',
    label: 'Email address',
    placeholder: 'Leave blank to hide it',
    hint: 'Optional. While this is empty, no email is shown anywhere on the site.',
    type: 'email',
  },
];

const inputClass =
  'w-full rounded-xl bg-surface-card px-3.5 py-2.5 font-body text-sm text-brand-ink ' +
  'ring-1 ring-brand-ink/12 transition-shadow placeholder:text-brand-ink/35 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-pink';

/*
 * Both groups in one state object, shaped exactly like the API's own body.
 *
 * The alternative — a `hero` state and a `contact` state — would need the
 * dirty check, the save and the discard each written twice, and the second
 * copy is where the bug lives.
 */
const pick = (data) => ({ hero: data.hero, contact: data.contact ?? {} });

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
      setSaved(pick(data));
      setDraft(pick(data));
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
   *
   * `changed` is only ever called behind the null guard in `dirty`.
   */
  const changed = (group, fields) =>
    fields.some((f) => (draft[group]?.[f.name] ?? '') !== (saved[group]?.[f.name] ?? ''));

  const dirty =
    !!draft &&
    !!saved &&
    (changed('hero', FIELDS) || changed('contact', CONTACT_FIELDS));

  const setField = (group, name, value) =>
    setDraft((d) => ({ ...d, [group]: { ...d[group], [name]: value } }));

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      /*
       * Both groups every time, including untouched ones. The API treats a
       * missing field as "leave alone", so sending the whole form is harmless
       * and means one Save button covers the whole tab.
       *
       * `?? ''` rather than a skip: an emptied field has to be sent as "" to
       * actually clear it server-side.
       */
      const group = (fields, from) =>
        Object.fromEntries(fields.map((f) => [f.name, from?.[f.name] ?? '']));

      const data = await homeApi.updateSection({
        hero: group(FIELDS, draft.hero),
        contact: group(CONTACT_FIELDS, draft.contact),
      });

      setSaved(pick(data));
      setDraft(pick(data));
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
      setSaved(pick(data));
      // Keep whatever the owner is part-way through typing; take only the image.
      setDraft((d) => ({ ...d, hero: { ...d.hero, image: data.hero.image } }));
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
      setSaved(pick(data));
      setDraft((d) => ({ ...d, hero: { ...d.hero, image: data.hero.image } }));
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

  const imageSrc = draft.hero.image?.url || heroImages.showcase[2];
  const hasOwnImage = Boolean(draft.hero.image?.url);

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
                  value={draft.hero[field.name] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(e) => setField('hero', field.name, e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  className={inputClass}
                  value={draft.hero[field.name] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(e) => setField('hero', field.name, e.target.value)}
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
              alt={draft.hero.imageAlt || 'Hero image'}
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

      {/* --------------------------------------------------------- contact */}
      {/* Its own block below the grid rather than a third column: these
          details belong to the whole site, not to the hero, and sitting them
          beside the hero fields would imply otherwise. */}
      <div className="border-t border-brand-ink/10 pt-6">
        <h2 className="font-display text-lg font-bold text-brand-ink">Contact details</h2>
        <p className="mt-0.5 font-body text-sm text-brand-ink/55">
          Shown in the footer, the menu and the enquiry section. Leave a field empty to hide
          it from the site.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONTACT_FIELDS.map((field) => (
            <label key={field.name} className="flex flex-col gap-1.5">
              <span className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
                {field.label}
              </span>

              <input
                type={field.type ?? 'text'}
                className={inputClass}
                value={draft.contact[field.name] ?? ''}
                placeholder={field.placeholder}
                onChange={(e) => setField('contact', field.name, e.target.value)}
              />

              <span className="font-body text-xs leading-relaxed text-brand-ink/50">
                {field.hint}
              </span>
            </label>
          ))}
        </div>
      </div>

      {dirty ? (
        <SaveBar
          summary="You have unsaved changes on this page."
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

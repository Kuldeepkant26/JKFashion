import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiImage,
  FiUploadCloud,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiArrowRight,
  FiEdit2,
  FiCheck,
  FiX,
  FiAlertCircle,
} from 'react-icons/fi';
import * as galleryApi from '../../../api/gallery.api.js';
import Spinner from '../../components/Spinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import SettingsStatus from './SettingsStatus.jsx';

/** Mirrors the API's own cap, so an oversized file is caught before upload. */
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';

/** Filename without its extension — a sensible default title. */
const titleFromFile = (name) => name.replace(/\.[^.]+$/, '');

/* ========================================================================== */
/*  Upload queue                                                              */
/* ========================================================================== */

/**
 * One row in the pre-upload queue.
 *
 * Files are staged rather than sent immediately so a title and caption can be
 * set BEFORE the image exists — previously the only way to name an image was
 * to upload it and then rename it, which meant every upload briefly went live
 * on the website under its filename.
 */
function QueueRow({ item, onChange, onRemove, disabled }) {
  return (
    <li className="flex gap-3 rounded-xl bg-surface-card p-3 ring-1 ring-black/5">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-ink/5">
        <img src={item.preview} alt="" className="h-full w-full object-cover" />

        {item.status === 'uploading' ? (
          <div className="absolute inset-0 grid place-items-center bg-brand-ink/45">
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
          </div>
        ) : null}

        {item.status === 'done' ? (
          <div className="absolute inset-0 grid place-items-center bg-emerald-600/70">
            <FiCheck className="text-white" size={22} aria-hidden="true" />
          </div>
        ) : null}

        {item.status === 'error' ? (
          <div className="absolute inset-0 grid place-items-center bg-rose-600/70">
            <FiAlertCircle className="text-white" size={20} aria-hidden="true" />
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <input
          type="text"
          value={item.title}
          disabled={disabled}
          onChange={(e) => onChange(item.id, { title: e.target.value })}
          placeholder="Image name"
          aria-label={`Name for ${item.file.name}`}
          className="w-full rounded-lg border border-brand-ink/12 bg-surface-primary px-2.5 py-1.5
                     font-body text-sm font-semibold text-brand-ink
                     focus:border-brand-pink focus:outline-none disabled:opacity-60"
        />
        <input
          type="text"
          value={item.caption}
          disabled={disabled}
          onChange={(e) => onChange(item.id, { caption: e.target.value })}
          placeholder="Caption (optional)"
          aria-label={`Caption for ${item.file.name}`}
          className="w-full rounded-lg border border-brand-ink/12 bg-surface-primary px-2.5 py-1.5
                     font-body text-xs text-brand-ink/70
                     focus:border-brand-pink focus:outline-none disabled:opacity-60"
        />

        <p className="font-body text-[11px] text-brand-ink/40">
          {item.file.name} · {(item.file.size / 1024 / 1024).toFixed(1)}MB
          {item.error ? <span className="text-rose-600"> — {item.error}</span> : null}
        </p>
      </div>

      {!disabled ? (
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.file.name} from the queue`}
          className="h-8 w-8 shrink-0 rounded-lg text-brand-ink/35 transition-colors
                     hover:bg-rose-50 hover:text-rose-600"
        >
          <FiX className="mx-auto" size={16} aria-hidden="true" />
        </button>
      ) : null}
    </li>
  );
}

/* ========================================================================== */
/*  Existing image card                                                       */
/* ========================================================================== */

/**
 * One uploaded image.
 *
 * Editing is an explicit mode rather than always-live inputs. The previous
 * version saved on blur, which meant clicking away from a half-typed caption
 * committed it — and gave no signal that anything had been saved at all.
 */
function ImageCard({ item, index, total, onSave, onToggle, onDelete, onMove, busy }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [caption, setCaption] = useState(item.caption ?? '');
  const [saving, setSaving] = useState(false);

  // Re-sync when the row is replaced by a fresh fetch, so an edit made
  // elsewhere does not leave stale text sitting in a closed form.
  useEffect(() => {
    if (!editing) {
      setTitle(item.title);
      setCaption(item.caption ?? '');
    }
  }, [item.title, item.caption, editing]);

  const cancel = () => {
    setTitle(item.title);
    setCaption(item.caption ?? '');
    setEditing(false);
  };

  const save = async () => {
    const next = title.trim();
    if (!next) return; // the API requires a title; an empty one is a no-op

    setSaving(true);
    const ok = await onSave(item._id, { title: next, caption: caption.trim() });
    setSaving(false);
    if (ok) setEditing(false);
  };

  return (
    <li
      className={`flex flex-col overflow-hidden rounded-2xl bg-surface-card ring-1 transition
                  ${item.isActive ? 'ring-black/5' : 'opacity-60 ring-brand-ink/10'}`}
    >
      <div className="relative aspect-[4/3] bg-brand-ink/5">
        <img
          src={item.url}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover"
        />

        {!item.isActive ? (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full
                           bg-brand-ink/70 px-2 py-0.5 font-body text-[10px] font-semibold
                           uppercase tracking-wider text-white">
            <FiEyeOff size={11} aria-hidden="true" /> Hidden
          </span>
        ) : null}

        <span className="absolute right-2 top-2 rounded-full bg-brand-ink/60 px-2 py-0.5
                         font-body text-[10px] font-semibold text-white">
          {index + 1}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {editing ? (
          <>
            <input
              type="text"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Image name"
              className="w-full rounded-lg border border-brand-pink/40 bg-surface-primary px-2.5
                         py-1.5 font-body text-sm font-semibold text-brand-ink
                         focus:border-brand-pink focus:outline-none"
            />
            <input
              type="text"
              value={caption}
              placeholder="Caption (optional)"
              onChange={(e) => setCaption(e.target.value)}
              aria-label="Image caption"
              className="w-full rounded-lg border border-brand-pink/40 bg-surface-primary px-2.5
                         py-1.5 font-body text-xs text-brand-ink/70
                         focus:border-brand-pink focus:outline-none"
            />

            <div className="mt-auto flex gap-1.5 pt-1">
              <button
                type="button"
                onClick={save}
                disabled={saving || !title.trim()}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg
                           bg-brand-pink px-3 py-2 font-body text-xs font-semibold
                           text-on-primary transition-colors hover:bg-brand-pink-dark
                           disabled:opacity-50"
              >
                <FiCheck size={14} aria-hidden="true" />
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={cancel}
                disabled={saving}
                className="rounded-lg px-3 py-2 font-body text-xs font-semibold text-brand-ink/60
                           ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5
                           disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="truncate font-body text-sm font-semibold text-brand-ink">
              {item.title}
            </p>
            <p className="line-clamp-2 font-body text-xs text-brand-ink/50">
              {item.caption || <span className="italic text-brand-ink/30">No caption</span>}
            </p>

            <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
              <button
                type="button"
                onClick={() => onMove(index, -1)}
                disabled={index === 0 || busy}
                aria-label="Move earlier"
                title="Move earlier"
                className="grid h-8 w-8 place-items-center rounded-lg text-brand-ink/50
                           ring-1 ring-brand-ink/10 transition hover:bg-brand-ink/5
                           disabled:opacity-30"
              >
                <FiArrowLeft size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onMove(index, 1)}
                disabled={index === total - 1 || busy}
                aria-label="Move later"
                title="Move later"
                className="grid h-8 w-8 place-items-center rounded-lg text-brand-ink/50
                           ring-1 ring-brand-ink/10 transition hover:bg-brand-ink/5
                           disabled:opacity-30"
              >
                <FiArrowRight size={14} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={busy}
                aria-label={`Edit ${item.title}`}
                title="Edit name and caption"
                className="grid h-8 w-8 place-items-center rounded-lg text-brand-ink/50
                           ring-1 ring-brand-ink/10 transition hover:bg-brand-ink/5
                           disabled:opacity-50"
              >
                <FiEdit2 size={14} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onToggle(item)}
                disabled={busy}
                title={item.isActive ? 'Hide from the website' : 'Show on the website'}
                className="grid h-8 w-8 place-items-center rounded-lg text-brand-ink/50
                           ring-1 ring-brand-ink/10 transition hover:bg-brand-ink/5
                           disabled:opacity-50"
              >
                {item.isActive ? (
                  <FiEyeOff size={14} aria-hidden="true" />
                ) : (
                  <FiEye size={14} aria-hidden="true" />
                )}
                <span className="sr-only">{item.isActive ? 'Hide' : 'Show'}</span>
              </button>

              <button
                type="button"
                onClick={() => onDelete(item)}
                disabled={busy}
                aria-label={`Delete ${item.title}`}
                title="Delete permanently"
                className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-rose-600
                           ring-1 ring-rose-200 transition hover:bg-rose-50 disabled:opacity-50"
              >
                <FiTrash2 size={14} aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    </li>
  );
}

/* ========================================================================== */

export default function GalleryTab() {
  const [items, setItems] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const fileRef = useRef(null);
  /** Object URLs need revoking, or every preview leaks until a reload. */
  const previewsRef = useRef([]);

  const flash = (message) => {
    setNote(message);
    setTimeout(() => setNote(''), 2500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await galleryApi.listAll();
      setItems(data?.items ?? []);
      setError('');
    } catch (err) {
      setError(err?.message ?? 'Could not load the gallery.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(
    () => () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    []
  );

  /* --------------------------------------------------------------- queue */

  const stageFiles = (fileList) => {
    const files = [...fileList];
    if (!files.length) return;

    const rejected = files.filter((f) => f.size > MAX_BYTES);
    if (rejected.length) {
      setError(
        `${rejected.map((f) => `“${f.name}”`).join(', ')} ${
          rejected.length === 1 ? 'is' : 'are'
        } larger than 8MB and cannot be uploaded.`
      );
    }

    const accepted = files.filter((f) => f.size <= MAX_BYTES);
    if (!accepted.length) return;

    setQueue((q) => [
      ...q,
      ...accepted.map((file) => {
        const preview = URL.createObjectURL(file);
        previewsRef.current.push(preview);
        return {
          id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          preview,
          title: titleFromFile(file.name),
          caption: '',
          status: 'pending',
          error: '',
        };
      }),
    ]);

    if (fileRef.current) fileRef.current.value = '';
  };

  const updateQueued = (id, patch) =>
    setQueue((q) => q.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const removeQueued = (id) =>
    setQueue((q) => q.filter((item) => item.id !== id));

  const uploadQueue = async () => {
    if (!queue.length) return;

    setUploading(true);
    setError('');

    let uploaded = 0;

    /*
     * Sequential rather than parallel: each upload streams a file through the
     * API to Cloudinary, and firing ten at once would have them compete for the
     * same bandwidth and arrive in a nondeterministic order — which is also the
     * order they would be given in the grid.
     */
    for (const item of queue) {
      if (item.status === 'done') continue;

      updateQueued(item.id, { status: 'uploading', error: '' });
      try {
        await galleryApi.upload({
          file: item.file,
          title: item.title.trim() || titleFromFile(item.file.name),
          caption: item.caption.trim(),
        });
        updateQueued(item.id, { status: 'done' });
        uploaded += 1;
      } catch (err) {
        // Mark this one and carry on — one bad file should not strand the rest.
        updateQueued(item.id, {
          status: 'error',
          error: err?.message ?? 'Upload failed',
        });
      }
    }

    setUploading(false);

    if (uploaded) {
      flash(`${uploaded} image${uploaded === 1 ? '' : 's'} uploaded`);
      await load();
      // Clear only the successes, so a failed row stays visible to retry.
      setQueue((q) => q.filter((item) => item.status !== 'done'));
    }
  };

  /* ------------------------------------------------------------- existing */

  const saveImage = async (id, patch) => {
    const before = items;
    setItems((list) => list.map((i) => (i._id === id ? { ...i, ...patch } : i)));
    try {
      await galleryApi.update(id, patch);
      flash('Saved');
      return true;
    } catch (err) {
      setItems(before);
      setError(err?.message ?? 'Could not save that image.');
      return false;
    }
  };

  const toggleActive = (item) =>
    saveImage(item._id, { isActive: !item.isActive }).then((ok) => {
      if (ok) flash(item.isActive ? 'Image hidden' : 'Image shown');
    });

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete “${item.title}”? This also removes it from Cloudinary.`)) {
      return;
    }

    setBusy(true);
    try {
      await galleryApi.remove(item._id);
      flash('Image deleted');
      await load();
    } catch (err) {
      setError(err?.message ?? 'Could not delete that image.');
    } finally {
      setBusy(false);
    }
  };

  const move = async (index, delta) => {
    const next = index + delta;
    if (next < 0 || next >= items.length) return;

    const reordered = [...items];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    setItems(reordered);

    try {
      await galleryApi.reorder(reordered.map((i) => i._id));
    } catch (err) {
      setError(err?.message ?? 'Could not save the new order.');
      load(); // resync — the optimistic order may now be wrong
    }
  };

  const activeCount = items.filter((i) => i.isActive).length;

  return (
    <div className="flex flex-col gap-5">
      <SettingsStatus note={note} error={error} />

      <p className="rounded-xl bg-brand-pink/8 px-4 py-3 text-sm text-brand-ink/70">
        These images fill the grid under “Look Closer” on the home page. The first one is
        selected by default; visitors pick any of the others to view it enlarged.
      </p>

      {/* ------------------------------------------------------- uploader */}
      <div>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            stageFiles(e.dataTransfer.files);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl
                      border-2 border-dashed px-6 py-10 text-center transition-colors
                      ${
                        dragging
                          ? 'border-brand-pink bg-brand-pink/[0.06]'
                          : 'border-brand-ink/15 bg-surface-card hover:border-brand-pink/50 hover:bg-brand-pink/[0.03]'
                      } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="sr-only"
            disabled={uploading}
            onChange={(e) => stageFiles(e.target.files)}
          />

          <FiUploadCloud size={30} className="text-brand-ink/30" aria-hidden="true" />
          <span className="font-body text-sm font-semibold text-brand-ink">
            Drop images here, or click to choose
          </span>
          <span className="font-body text-xs text-brand-ink/45">
            JPEG, PNG, WebP or AVIF · up to 8MB each · several at once is fine
          </span>
        </label>
      </div>

      {/* --------------------------------------------------------- queue */}
      {queue.length ? (
        <div className="rounded-2xl bg-brand-ink/[0.03] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold text-brand-ink">
              Ready to upload{' '}
              <span className="font-body text-sm font-normal text-brand-ink/45">
                ({queue.length})
              </span>
            </h2>

            <div className="flex gap-2">
              {!uploading ? (
                <button
                  type="button"
                  onClick={() => setQueue([])}
                  className="rounded-xl px-3.5 py-2 font-body text-sm font-semibold
                             text-brand-ink/60 ring-1 ring-brand-ink/12 transition-colors
                             hover:bg-brand-ink/5"
                >
                  Clear
                </button>
              ) : null}

              <button
                type="button"
                onClick={uploadQueue}
                disabled={uploading}
                className="flex items-center gap-2 rounded-xl bg-brand-pink px-4 py-2 font-body
                           text-sm font-semibold text-on-primary transition-colors
                           hover:bg-brand-pink-dark disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <span
                      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40
                                 border-t-white"
                      aria-hidden="true"
                    />
                    Uploading…
                  </>
                ) : (
                  <>
                    <FiUploadCloud size={15} aria-hidden="true" />
                    Upload {queue.length}
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="mb-3 font-body text-xs text-brand-ink/45">
            Set a name and caption before uploading — both can still be changed afterwards.
          </p>

          <ul className="flex flex-col gap-2">
            {queue.map((item) => (
              <QueueRow
                key={item.id}
                item={item}
                onChange={updateQueued}
                onRemove={removeQueued}
                disabled={uploading}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {/* ---------------------------------------------------------- list */}
      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-brand-ink">
          Images{' '}
          <span className="font-body text-sm font-normal text-brand-ink/45">
            ({activeCount} shown
            {items.length !== activeCount ? `, ${items.length - activeCount} hidden` : ''})
          </span>
        </h2>

        {loading ? (
          <div className="grid min-h-[30vh] place-items-center">
            <Spinner label="Loading gallery" />
          </div>
        ) : items.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <ImageCard
                key={item._id}
                item={item}
                index={index}
                total={items.length}
                onSave={saveImage}
                onToggle={toggleActive}
                onDelete={handleDelete}
                onMove={move}
                busy={busy || uploading}
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            className="min-h-[30vh] bg-surface-card"
            icon={FiImage}
            title="No images yet"
            hint="Upload a few above and they will appear in the Look Closer grid."
          />
        )}
      </div>
    </div>
  );
}

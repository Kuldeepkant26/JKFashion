import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiUploadCloud,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiArrowRight,
  FiPlus,
  FiFilm,
  FiCheck,
  FiEdit2,
} from 'react-icons/fi';
import * as processApi from '../../../api/process.api.js';
import Spinner from '../../components/Spinner.jsx';
import SettingsStatus from './SettingsStatus.jsx';
import Editable from './editor/Editable.jsx';
import { Tools, ToolButton } from './editor/Tools.jsx';
import {
  PROCESS_ICON_IDS,
  getProcessIcon,
} from '../../../data/processIcons.jsx';

/*
 * The website's own stylesheet, not a copy of it.
 *
 * This tab renders the real section markup so the owner edits the thing as it
 * will actually look. Importing the same CSS is what guarantees the preview
 * cannot drift from the live page — a re-styled section updates here for free.
 * The brand tokens it depends on are declared on :root, so they resolve inside
 * the admin panel exactly as they do on the marketing site.
 */
import '../../../css/HowWeWork.css';
import './ProcessTab.css';

/** Mirrors the API's own caps, so an oversized file is caught before upload. */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';
const VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/webm';


/**
 * Choose the glyph for a stage.
 *
 * A popover over the disc rather than a separate field: the icon IS the disc,
 * so the thing you click to change it should be the thing you are changing.
 */
function IconPicker({ current, onPick, disabled }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const Current = getProcessIcon(current);

  // Close on an outside click or Escape — expected of anything popover-like.
  useEffect(() => {
    if (!open) return undefined;

    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span className="pt-icon-wrap" ref={wrapRef}>
      <span className="hww-row-icon" aria-hidden="true">
        <Current />
      </span>

      <button
        type="button"
        className="pt-icon-btn"
        disabled={disabled}
        aria-label="Change this stage's icon"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <FiEdit2 size={14} aria-hidden="true" />
        <span>Icon</span>
      </button>

      {open ? (
        <div className="pt-icon-pop" role="listbox" aria-label="Choose an icon">
          {PROCESS_ICON_IDS.map((id) => {
            const Icon = getProcessIcon(id);
            return (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={id === current}
                title={id}
                className={`pt-icon-opt ${id === current ? 'pt-icon-opt-on' : ''}`}
                onClick={() => {
                  setOpen(false);
                  if (id !== current) onPick(id);
                }}
              >
                <Icon />
              </button>
            );
          })}
        </div>
      ) : null}
    </span>
  );
}


/* ========================================================================== */

export default function ProcessTab() {
  const [section, setSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [uploadPct, setUploadPct] = useState(null);

  const videoRef = useRef(null);
  const posterRef = useRef(null);
  const facilityRef = useRef(null);

  const flash = (message) => {
    setNote(message);
    setTimeout(() => setNote(''), 2500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSection(await processApi.getAdmin());
      setError('');
    } catch (err) {
      setError(err?.message ?? 'Could not load this section.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Wrap a write so every one of them reports failure the same way. */
  const run = async (fn, successNote) => {
    setBusy(true);
    setError('');
    try {
      const data = await fn();
      if (data) setSection(data);
      if (successNote) flash(successNote);
      return true;
    } catch (err) {
      setError(err?.message ?? 'That did not save. Please try again.');
      // Re-sync: an inline edit that failed is still sitting in the DOM, and
      // leaving it there would imply it had been saved.
      load();
      return false;
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------------------------------------ section */

  /** Every inline text commit goes through here — one field at a time. */
  const saveField = (field, value) =>
    run(() => processApi.updateSection({ [field]: value }), 'Saved');

  const toggleFlag = (field, label) =>
    run(
      () => processApi.updateSection({ [field]: !section[field] }),
      section[field] ? `${label} hidden` : `${label} now visible`
    );

  /* -------------------------------------------------------------- steps */

  const addStep = () =>
    run(
      () =>
        processApi.addStep({
          title: 'New stage',
          summary: 'What happens here',
          description: '',
        }),
      'Stage added'
    );

  const saveStep = (id, patch) => run(() => processApi.updateStep(id, patch), 'Saved');

  const toggleStep = (step) =>
    run(
      () => processApi.updateStep(step._id, { isActive: !step.isActive }),
      step.isActive ? 'Stage hidden' : 'Stage now visible'
    );

  const deleteStep = (step) => {
    if (!window.confirm(`Delete “${step.title}”? This cannot be undone.`)) return;
    return run(() => processApi.deleteStep(step._id), 'Stage removed');
  };

  const moveStep = (index, delta) => {
    const ordered = [...section.steps].sort((a, b) => a.order - b.order);
    const next = index + delta;
    if (next < 0 || next >= ordered.length) return;
    [ordered[index], ordered[next]] = [ordered[next], ordered[index]];
    return run(() => processApi.reorderSteps(ordered.map((s) => s._id)));
  };

  /* -------------------------------------------------------------- video */

  const uploadVideo = async (file) => {
    if (file.size > MAX_VIDEO_BYTES) {
      setError(`“${file.name}” is larger than 100MB. Please compress it first.`);
      return;
    }

    setBusy(true);
    setError('');
    setUploadPct(0);
    try {
      setSection(await processApi.setVideo(file, setUploadPct));
      flash('Video uploaded');
    } catch (err) {
      setError(err?.message ?? 'The video did not upload.');
    } finally {
      setUploadPct(null);
      setBusy(false);
    }
  };

  const removeVideo = () => {
    if (!window.confirm('Remove this video? It is deleted from storage too.')) return;
    return run(() => processApi.clearVideo(), 'Video removed');
  };

  const uploadPoster = (file) => {
    if (file.size > MAX_IMAGE_BYTES) {
      setError(`“${file.name}” is larger than 8MB.`);
      return;
    }
    return run(() => processApi.setVideoPoster(file), 'Cover image updated');
  };

  /* ----------------------------------------------------------- facility */

  const addPhotos = async (fileList) => {
    const files = [...fileList].filter((f) => {
      if (f.size > MAX_IMAGE_BYTES) {
        setError(`“${f.name}” is larger than 8MB and was skipped.`);
        return false;
      }
      return true;
    });
    if (!files.length) return;

    setBusy(true);
    let added = 0;

    // Sequential rather than parallel: each upload streams through the API to
    // Cloudinary, and firing many at once would have them compete for the same
    // bandwidth and arrive in a nondeterministic order — which is also the
    // order they would be given in the mosaic.
    for (const file of files) {
      try {
        setSection(await processApi.addFacilityPhoto(file, ''));
        added += 1;
      } catch (err) {
        setError(err?.message ?? `“${file.name}” did not upload.`);
      }
    }

    setBusy(false);
    if (added) flash(`${added} photo${added === 1 ? '' : 's'} added`);
  };

  const savePhoto = (id, patch) =>
    run(() => processApi.updateFacilityPhoto(id, patch), 'Saved');

  const deletePhoto = (photo) => {
    if (!window.confirm('Delete this photo? This cannot be undone.')) return;
    return run(() => processApi.deleteFacilityPhoto(photo._id), 'Photo removed');
  };

  const movePhoto = (index, delta) => {
    const ordered = [...section.facilityPhotos].sort((a, b) => a.order - b.order);
    const next = index + delta;
    if (next < 0 || next >= ordered.length) return;
    [ordered[index], ordered[next]] = [ordered[next], ordered[index]];
    return run(() => processApi.reorderFacilityPhotos(ordered.map((p) => p._id)));
  };

  /* --------------------------------------------------------------- view */

  if (loading || !section) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner label="Loading section" />
      </div>
    );
  }

  const steps = [...section.steps].sort((a, b) => a.order - b.order);
  const photos = [...section.facilityPhotos].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-4">
      <SettingsStatus note={note} error={error} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl
                      bg-brand-pink/8 px-4 py-3">
        <p className="font-body text-sm text-brand-ink/70">
          This is the live section. Click any text to edit it, hover a photo to replace
          it. Everything saves as you go.
        </p>
        {busy ? (
          <span className="flex items-center gap-2 font-body text-xs font-semibold
                           text-brand-ink/50">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-ink/20
                             border-t-brand-ink/60" />
            Saving…
          </span>
        ) : null}
      </div>

      {/* Hidden inputs, shared by every control that needs a file. */}
      <input
        ref={videoRef}
        type="file"
        accept={VIDEO_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadVideo(file);
          e.target.value = '';
        }}
      />
      <input
        ref={posterRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadPoster(file);
          e.target.value = '';
        }}
      />
      <input
        ref={facilityRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) addPhotos(e.target.files);
          e.target.value = '';
        }}
      />

      {/* ==================================================================
          The section itself. Same markup and same stylesheet as the site.
          ================================================================== */}
      <div className="pt-canvas">
        <section className="hww-section">
          <span className="hww-aura" aria-hidden="true" />

          <div className="hww-container">
            {/* ----------------------------------------------- masthead */}
            <header className="hww-masthead">
              <div className="hww-masthead-lead">
                <p className="hww-label">
                  <span className="hww-label-rule" aria-hidden="true" />
                  <Editable
                    value={section.label}
                    placeholder="Small label"
                    onCommit={(v) => saveField('label', v)}
                  />
                </p>
                <h2 className="hww-title">
                  <Editable
                    value={section.title}
                    placeholder="Section title"
                    onCommit={(v) => saveField('title', v)}
                  />
                </h2>
              </div>

              <div className="hww-masthead-aside">
                <p className="hww-intro">
                  <Editable
                    value={section.intro}
                    placeholder="Intro paragraph"
                    multiline
                    onCommit={(v) => saveField('intro', v)}
                  />
                </p>
              </div>
            </header>

            {/* ------------------------------------- part 1: the factory */}
            <div className={`hww-floor pt-part ${section.facilityEnabled ? '' : 'pt-hidden'}`}>
              <div className="pt-part-bar">
                <span className="pt-part-tag">Part 1 · Factory &amp; people</span>
                <div className="pt-part-bar-group">
                  <button
                    type="button"
                    className={`pt-flag ${section.facilityEnabled ? 'pt-flag-on' : ''}`}
                    onClick={() => toggleFlag('facilityEnabled', 'Photos')}
                    disabled={busy}
                  >
                    {section.facilityEnabled ? <FiEye size={13} /> : <FiEyeOff size={13} />}
                    {section.facilityEnabled ? 'Shown on the site' : 'Hidden from the site'}
                  </button>
                  <button
                    type="button"
                    className="pt-add"
                    onClick={() => facilityRef.current?.click()}
                    disabled={busy}
                  >
                    <FiPlus size={13} aria-hidden="true" /> Add photos
                  </button>
                </div>
              </div>

              {photos.length ? (
                <ul className="hww-mosaic">
                  {/*
                    The copy panel is a cell of the mosaic, exactly as on the
                    site. This is where the facility heading lives now — it is
                    no longer a second centred heading under the masthead.
                  */}
                  <li className="hww-mosaic-note">
                    <div className="hww-note-inner">
                      <span className="hww-note-rule" aria-hidden="true" />
                      <h3 className="hww-note-heading">
                        <Editable
                          value={section.facilityHeading}
                          placeholder="Heading"
                          onCommit={(v) => saveField('facilityHeading', v)}
                        />
                      </h3>
                      <p className="hww-note-body">
                        <Editable
                          value={section.facilityBody}
                          placeholder="Paragraph under the heading"
                          multiline
                          onCommit={(v) => saveField('facilityBody', v)}
                        />
                      </p>
                      {/* Counts only what the site will actually draw, so the
                          number here matches the number a visitor sees. */}
                      <span className="hww-note-count" aria-hidden="true">
                        {String(photos.filter((p) => p.isActive).length).padStart(2, '0')}
                        <em>frames</em>
                      </span>
                    </div>
                  </li>

                  {photos.map((photo, index) => (
                    <li
                      className={`hww-frame pt-frame pt-editable-block ${
                        index === 0 ? 'hww-frame-lead' : ''
                      } ${photo.isActive ? '' : 'pt-hidden'}`}
                      key={photo._id}
                    >
                      <img className="hww-frame-img" src={photo.image?.url} alt="" />

                      <Tools label={`Photo ${index + 1} controls`}>
                        <ToolButton
                          title="Move earlier"
                          disabled={index === 0 || busy}
                          onClick={() => movePhoto(index, -1)}
                        >
                          <FiArrowLeft size={13} />
                        </ToolButton>
                        <ToolButton
                          title="Move later"
                          disabled={index === photos.length - 1 || busy}
                          onClick={() => movePhoto(index, 1)}
                        >
                          <FiArrowRight size={13} />
                        </ToolButton>
                        <ToolButton
                          title={photo.isActive ? 'Hide from the website' : 'Show'}
                          disabled={busy}
                          onClick={() => savePhoto(photo._id, { isActive: !photo.isActive })}
                        >
                          {photo.isActive ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                        </ToolButton>
                        <ToolButton
                          title="Delete this photo"
                          danger
                          disabled={busy}
                          onClick={() => deletePhoto(photo)}
                        >
                          <FiTrash2 size={13} />
                        </ToolButton>
                      </Tools>

                      {index === 0 ? <span className="pt-badge">Large tile</span> : null}

                      <span className="hww-frame-caption">
                        <span className="hww-frame-caption-text">
                          <Editable
                            value={photo.caption}
                            placeholder="Caption (optional)"
                            onCommit={(v) => savePhoto(photo._id, { caption: v })}
                          />
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <button
                  type="button"
                  className="pt-dropzone"
                  onClick={() => facilityRef.current?.click()}
                  disabled={busy}
                >
                  <FiUploadCloud size={26} aria-hidden="true" />
                  <span className="pt-dropzone-title">Add your factory photos</span>
                  <span className="pt-dropzone-hint">
                    JPEG, PNG, WebP or AVIF · up to 8MB each · several at once is fine
                  </span>
                </button>
              )}
            </div>

            {/* ------------------------------------- part 2: the stages */}
            <div className="hww-stages pt-part">
              <div className="pt-part-bar">
                <span className="pt-part-tag">Part 2 · Production flow</span>
                <button type="button" className="pt-add" onClick={addStep} disabled={busy}>
                  <FiPlus size={13} aria-hidden="true" /> Add a stage
                </button>
              </div>

              <div className="hww-stages-head">
                <h3 className="hww-stages-heading">
                  <Editable
                    value={section.stepsHeading}
                    placeholder="Heading above the stages (optional)"
                    onCommit={(v) => saveField('stepsHeading', v)}
                  />
                </h3>
                <span className="hww-stages-meta" aria-hidden="true">
                  {String(steps.filter((s) => s.isActive).length).padStart(2, '0')} stages
                </span>
              </div>

              {steps.length ? (
                <ol className="hww-ledger">
                  {steps.map((stage, index) => (
                    <li
                      className={`hww-row pt-row pt-editable-block ${
                        stage.isActive ? '' : 'pt-hidden'
                      }`}
                      key={stage._id}
                    >
                      <Tools label={`Stage ${index + 1} controls`}>
                        <ToolButton
                          title="Move earlier"
                          disabled={index === 0 || busy}
                          onClick={() => moveStep(index, -1)}
                        >
                          <FiArrowLeft size={13} />
                        </ToolButton>
                        <ToolButton
                          title="Move later"
                          disabled={index === steps.length - 1 || busy}
                          onClick={() => moveStep(index, 1)}
                        >
                          <FiArrowRight size={13} />
                        </ToolButton>
                        <ToolButton
                          title={stage.isActive ? 'Hide from the website' : 'Show'}
                          disabled={busy}
                          onClick={() => toggleStep(stage)}
                        >
                          {stage.isActive ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                        </ToolButton>
                        <ToolButton
                          title="Delete this stage"
                          danger
                          disabled={busy}
                          onClick={() => deleteStep(stage)}
                        >
                          <FiTrash2 size={13} />
                        </ToolButton>
                      </Tools>

                      <span className="hww-row-index" aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <IconPicker
                        current={stage.icon}
                        disabled={busy}
                        onPick={(icon) => saveStep(stage._id, { icon })}
                      />

                      <div className="hww-row-copy">
                        <h4 className="hww-row-title">
                          <Editable
                            value={stage.title}
                            placeholder="Stage name"
                            onCommit={(v) => saveStep(stage._id, { title: v })}
                          />
                        </h4>
                        <p className="hww-row-summary">
                          <Editable
                            value={stage.summary}
                            placeholder="One-line summary"
                            onCommit={(v) => saveStep(stage._id, { summary: v })}
                          />
                        </p>
                      </div>

                      <p className="hww-row-description">
                        <Editable
                          value={stage.description}
                          placeholder="Description"
                          multiline
                          onCommit={(v) => saveStep(stage._id, { description: v })}
                        />
                      </p>

                      <span className="hww-row-glow" aria-hidden="true" />
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="pt-empty">No stages yet — add one to start the flow.</p>
              )}
            </div>

            {/* -------------------------------------- part 3: the film */}
            <div className={`hww-film pt-part ${section.videoEnabled ? '' : 'pt-hidden'}`}>
              <div className="pt-part-bar pt-part-bar-span">
                <span className="pt-part-tag">Part 3 · The video</span>
                <button
                  type="button"
                  className={`pt-flag ${section.videoEnabled ? 'pt-flag-on' : ''}`}
                  onClick={() => toggleFlag('videoEnabled', 'Video')}
                  disabled={busy}
                >
                  {section.videoEnabled ? <FiEye size={13} /> : <FiEyeOff size={13} />}
                  {section.videoEnabled ? 'Shown on the site' : 'Hidden from the site'}
                </button>
              </div>

              <div className="hww-film-copy">
                <span className="hww-film-tag" aria-hidden="true">Film</span>
                <h3 className="hww-film-heading">
                  <Editable
                    value={section.videoHeading}
                    placeholder="Video heading"
                    onCommit={(v) => saveField('videoHeading', v)}
                  />
                </h3>
                <p className="hww-film-body">
                  <Editable
                    value={section.videoBody}
                    placeholder="Paragraph beside the video"
                    multiline
                    onCommit={(v) => saveField('videoBody', v)}
                  />
                </p>
              </div>

              <div className="hww-film-media">
                <div className="hww-film-frame pt-media">
                  {section.video?.url ? (
                    <video
                      className="hww-film-video"
                      src={section.video.url}
                      poster={section.videoPoster?.url || undefined}
                      controls
                      preload="metadata"
                    />
                  ) : (
                    <div className="pt-video-empty">
                      <FiFilm size={34} aria-hidden="true" />
                      <span>No video yet</span>
                    </div>
                  )}

                  {uploadPct !== null ? (
                    <div className="pt-progress">
                      <p>Uploading… {uploadPct}%</p>
                      <div className="pt-progress-track">
                        <div className="pt-progress-bar" style={{ width: `${uploadPct}%` }} />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="pt-media-actions">
                  <button
                    type="button"
                    className="pt-btn pt-btn-primary"
                    disabled={busy}
                    onClick={() => videoRef.current?.click()}
                  >
                    <FiUploadCloud size={14} aria-hidden="true" />
                    {section.video?.url ? 'Replace video' : 'Upload video'}
                  </button>
                  <button
                    type="button"
                    className="pt-btn"
                    disabled={busy}
                    onClick={() => posterRef.current?.click()}
                  >
                    {section.videoPoster?.url ? 'Replace cover' : 'Add cover image'}
                  </button>
                  {section.video?.url ? (
                    <button
                      type="button"
                      className="pt-btn pt-btn-danger"
                      disabled={busy}
                      onClick={removeVideo}
                    >
                      Remove
                    </button>
                  ) : null}
                  <span className="pt-hint">MP4, MOV or WebM · up to 100MB</span>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>

      <p className="flex items-center gap-1.5 font-body text-xs text-brand-ink/40">
        <FiEdit2 size={12} aria-hidden="true" />
        Text saves when you click away or press Enter. Press Escape to undo a change you
        are still typing.
      </p>
    </div>
  );
}

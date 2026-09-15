import { useCallback, useEffect, useState } from 'react';
import {
  FiMail,
  FiPlus,
  FiTrash2,
  FiAlertCircle,
  FiCheck,
  FiChevronDown,
} from 'react-icons/fi';
import * as enquiryApi from '../../api/enquiry.api.js';

/** Mirrors the API's own cap, so the limit is visible before a failed save. */
const MAX_RECIPIENTS = 5;

/**
 * Deliberately permissive — the server does the real validation. This exists
 * only to disable the Add button on an obviously incomplete address, so the
 * common typo is caught without a round trip.
 */
const looksLikeEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

/**
 * Where enquiry notifications are emailed.
 *
 * Collapsed by default: the Enquiries tab's job is reading enquiries, and this
 * is something an owner sets once and then rarely touches.
 */
export default function EnquiryNotifySettings() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSettings(await enquiryApi.getNotifySettings());
    } catch (err) {
      setError(err?.message ?? 'Could not load notification settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Saves immediately rather than behind a Save button.
   *
   * Every change here is a single discrete decision — add an address, remove
   * one, flip the switch — so there is nothing to batch, and an unsaved draft
   * would be a way to believe notifications are on when they are not.
   */
  const persist = async (patch, successMessage) => {
    setSaving(true);
    setError('');
    setNotice('');

    // Optimistic, so the row responds to the click rather than the round trip.
    const previous = settings;
    setSettings((s) => ({ ...s, ...patch }));

    try {
      const saved = await enquiryApi.updateNotifySettings(patch);
      setSettings(saved);
      setNotice(successMessage);
      // The confirmation has a short life — it reports a finished action, and
      // leaving it on screen would make it read as the current state.
      setTimeout(() => setNotice(''), 2500);
    } catch (err) {
      setSettings(previous); // the optimistic edit never happened
      setError(err?.message ?? 'Could not save that change.');
    } finally {
      setSaving(false);
    }
  };

  const addRecipient = async () => {
    const email = draft.trim().toLowerCase();
    if (!email) return;

    if (settings.recipients.includes(email)) {
      setError('That address is already on the list.');
      return;
    }

    if (settings.recipients.length >= MAX_RECIPIENTS) {
      setError(`You can notify up to ${MAX_RECIPIENTS} addresses.`);
      return;
    }

    setDraft('');
    await persist(
      { recipients: [...settings.recipients, email] },
      `${email} will now be notified`
    );
  };

  const removeRecipient = (email) =>
    persist(
      { recipients: settings.recipients.filter((r) => r !== email) },
      `${email} will no longer be notified`
    );

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      setTestResult(await enquiryApi.testNotifyTransport());
    } catch (err) {
      setTestResult({ ok: false, message: err?.message ?? 'The test could not be run.' });
    } finally {
      setTesting(false);
    }
  };

  const recipients = settings?.recipients ?? [];
  const active = Boolean(settings?.notifyEnabled && recipients.length && settings?.smtpConfigured);

  /** One line describing the whole feature's state, readable while collapsed. */
  const summary = () => {
    if (loading) return 'Loading…';
    if (!settings?.smtpConfigured) return 'Email sending is not set up on the server';
    if (!settings.notifyEnabled) return 'Turned off';
    if (!recipients.length) return 'No one is being notified yet';
    return `Notifying ${recipients.length} address${recipients.length === 1 ? '' : 'es'}`;
  };

  return (
    <section className="overflow-hidden rounded-2xl bg-surface-card ring-1 ring-black/5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors
                   hover:bg-brand-ink/[0.02] focus-visible:outline-2
                   focus-visible:outline-offset-2 focus-visible:outline-brand-pink"
      >
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl
                      ${active ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-ink/5 text-brand-ink/40'}`}
        >
          <FiMail size={16} aria-hidden="true" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block font-body text-sm font-semibold text-brand-ink">
            Email notifications
          </span>
          <span className="mt-0.5 block truncate font-body text-xs text-brand-ink/50">
            {summary()}
          </span>
        </span>

        <FiChevronDown
          size={18}
          aria-hidden="true"
          className={`shrink-0 text-brand-ink/35 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && !loading ? (
        <div className="border-t border-black/5 px-4 py-4">
          <p className="font-body text-[13px] leading-relaxed text-brand-ink/60">
            Get an email the moment someone sends an enquiry through the website. Replying
            to that email goes straight back to the person who wrote in.
          </p>

          {/* The server has no credentials: say so plainly, because saving a
              list here would otherwise look like it had switched something on. */}
          {!settings?.smtpConfigured ? (
            <p className="mt-3 flex gap-2 rounded-xl bg-amber-50 px-3 py-2.5 font-body text-xs
                          leading-relaxed text-amber-800">
              <FiAlertCircle size={15} className="mt-px shrink-0" aria-hidden="true" />
              <span>
                Email sending is not configured on the server yet, so no notifications will
                be delivered. You can still set the addresses below — they will start
                working as soon as your developer adds the mail credentials.
              </span>
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2.5 font-body text-xs text-rose-700">
              {error}
            </p>
          ) : null}

          {notice ? (
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5
                          font-body text-xs text-emerald-700">
              <FiCheck size={14} aria-hidden="true" />
              {notice}
            </p>
          ) : null}

          {/* ------------------------------------------------ on / off */}
          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl bg-brand-ink/[0.03] p-3">
            <input
              type="checkbox"
              checked={settings?.notifyEnabled ?? false}
              disabled={saving}
              onChange={(e) =>
                persist(
                  { notifyEnabled: e.target.checked },
                  e.target.checked ? 'Notifications turned on' : 'Notifications turned off'
                )
              }
              className="h-4 w-4 shrink-0 accent-brand-pink"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-body text-[13px] font-semibold text-brand-ink">
                Send me an email for every new enquiry
              </span>
              <span className="mt-0.5 block font-body text-[11px] text-brand-ink/45">
                Enquiries are always saved here whether this is on or off.
              </span>
            </span>
          </label>

          {/* ---------------------------------------------- recipients */}
          <div className="mt-4">
            <p className="font-body text-xs font-semibold uppercase tracking-wider text-brand-ink/45">
              Send to
            </p>

            {recipients.length ? (
              <ul className="mt-2 flex flex-col gap-1.5">
                {recipients.map((email) => (
                  <li
                    key={email}
                    className="flex items-center gap-2 rounded-xl bg-brand-ink/[0.03] py-2 pl-3 pr-2"
                  >
                    <span className="min-w-0 flex-1 truncate font-body text-[13px] text-brand-ink/80">
                      {email}
                    </span>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => removeRecipient(email)}
                      aria-label={`Stop notifying ${email}`}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-brand-ink/35
                                 transition-colors hover:bg-rose-50 hover:text-rose-600
                                 disabled:opacity-40"
                    >
                      <FiTrash2 size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 rounded-xl bg-brand-ink/[0.03] px-3 py-2.5 font-body text-xs text-brand-ink/45">
                No addresses yet — add one below to start receiving enquiries by email.
              </p>
            )}

            {recipients.length < MAX_RECIPIENTS ? (
              <form
                className="mt-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addRecipient();
                }}
              >
                <input
                  type="email"
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setError('');
                  }}
                  placeholder="name@company.com"
                  aria-label="Email address to notify"
                  disabled={saving}
                  className="min-w-0 flex-1 rounded-xl border border-brand-ink/12 bg-surface-primary
                             px-3 py-2 font-body text-[13px] text-brand-ink
                             placeholder:text-brand-ink/30 focus:border-brand-pink
                             focus:outline-none disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={saving || !looksLikeEmail(draft)}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-pink px-3.5 py-2
                             font-body text-xs font-semibold text-on-primary transition-colors
                             hover:bg-brand-pink-dark disabled:opacity-40"
                >
                  <FiPlus size={14} aria-hidden="true" />
                  Add
                </button>
              </form>
            ) : (
              <p className="mt-2 font-body text-[11px] text-brand-ink/40">
                That is the maximum of {MAX_RECIPIENTS} addresses. Remove one to add another.
              </p>
            )}
          </div>

          {/* --------------------------------------------- connection test */}
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-black/5 pt-4">
            <button
              type="button"
              onClick={runTest}
              disabled={testing}
              className="rounded-xl px-3.5 py-2 font-body text-xs font-semibold text-brand-ink/65
                         ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5
                         disabled:opacity-60"
            >
              {testing ? 'Checking…' : 'Test connection'}
            </button>

            {testResult ? (
              <p
                className={`flex min-w-0 items-center gap-1.5 font-body text-xs
                            ${testResult.ok ? 'text-emerald-700' : 'text-rose-700'}`}
              >
                {testResult.ok ? (
                  <FiCheck size={14} className="shrink-0" aria-hidden="true" />
                ) : (
                  <FiAlertCircle size={14} className="shrink-0" aria-hidden="true" />
                )}
                <span className="min-w-0 break-words">{testResult.message}</span>
              </p>
            ) : (
              <p className="font-body text-[11px] text-brand-ink/40">
                Checks the mail server without sending anything.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

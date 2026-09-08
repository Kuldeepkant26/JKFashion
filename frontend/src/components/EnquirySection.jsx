import { useEffect, useRef, useState } from 'react';
import * as enquiryApi from '../api/enquiry.api.js';
import { contact, company } from '../data/site.js';
import '../css/EnquirySection.css';

/** The anchor the navbars' Enquire buttons scroll to. */
export const ENQUIRY_SECTION_ID = 'enquiry';

/** Remembers that this browser has sent before, so the button can say so. */
const SENT_KEY = 'jk-enquiry-sent';

const readSent = () => {
  try {
    const raw = localStorage.getItem(SENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeSent = (record) => {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify(record));
  } catch {
    // Private browsing — the enquiry still sent, we just cannot remember it.
  }
};

const EMPTY = { name: '', email: '', phone: '', company: '', message: '' };

/**
 * How long ago, in words. Deliberately coarse — a buyer only needs to know
 * roughly when they last wrote, and an exact timestamp reads like a receipt.
 */
const timeAgo = (iso) => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;

  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export default function EnquirySection() {
  const [values, setValues] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  /** The previous submission from this browser, if any. */
  const [sent, setSent] = useState(() => readSent());

  /** True only for the moments right after a successful send. */
  const [justSent, setJustSent] = useState(false);

  const formRef = useRef(null);
  const statusRef = useRef(null);

  // Sending clears the form; a second enquiry starts from blank rather than
  // making the sender delete what they already sent.
  useEffect(() => {
    if (!justSent) return undefined;
    const timer = setTimeout(() => setJustSent(false), 6000);
    return () => clearTimeout(timer);
  }, [justSent]);

  const setField = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    // Clear this field's error as soon as it is edited — leaving it visible
    // while someone is fixing it reads as though the fix did not register.
    setFieldErrors((f) => (f[key] ? { ...f, [key]: undefined } : f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;

    setSending(true);
    setError('');
    setFieldErrors({});

    try {
      // Read the honeypot straight off the form rather than holding it in
      // state: it must stay untouched by React so a bot's autofill is the only
      // thing that can ever put a value in it.
      const website = formRef.current?.elements?.website?.value ?? '';

      const data = await enquiryApi.create({ ...values, website });

      const record = { at: data?.createdAt ?? new Date().toISOString() };
      writeSent(record);
      setSent(record);
      setJustSent(true);
      setValues(EMPTY);

      // Move focus to the confirmation so a screen reader announces it and a
      // keyboard user is not left at the bottom of a form that just emptied.
      statusRef.current?.focus();
    } catch (err) {
      setFieldErrors(err?.fieldErrors ?? {});
      setError(
        err?.fieldErrors && Object.keys(err.fieldErrors).length
          ? 'Please check the highlighted fields.'
          : err?.message ?? 'Could not send your enquiry. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  const buttonLabel = sending
    ? 'Sending…'
    : sent
      ? 'Send Another Enquiry'
      : 'Send Enquiry';

  return (
    <section id={ENQUIRY_SECTION_ID} className="enquiry" aria-labelledby="enquiry-title">
      <div className="enquiry__inner">
        {/* ------------------------------------------------------- intro */}
        <div className="enquiry__intro">
          <span className="enquiry__label">Get in touch</span>
          <h2 className="enquiry__title" id="enquiry-title">
            Tell Us What You Need
          </h2>
          <p className="enquiry__lead">
            Send a reference, a rough idea or a shade card and we will come back with what it
            takes to run it — quality, lead time and the sampling we would recommend first.
          </p>

          <dl className="enquiry__details">
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${contact.salesEmail}`}>{contact.salesEmail}</a>
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>{contact.phone}</a>
              </dd>
            </div>
            <div>
              <dt>Company</dt>
              <dd>{company.name}</dd>
            </div>
          </dl>
        </div>

        {/* -------------------------------------------------------- form */}
        <form className="enquiry__form" onSubmit={handleSubmit} noValidate ref={formRef}>
          {/*
            Live region for both outcomes. tabIndex -1 so focus can be moved
            here programmatically after a send without adding it to the tab
            order for everyone else.
          */}
          <div
            className="enquiry__status"
            role="status"
            aria-live="polite"
            tabIndex={-1}
            ref={statusRef}
          >
            {justSent ? (
              <p className="enquiry__sent">
                Thank you — your enquiry is with our team. We usually reply within one working
                day.
              </p>
            ) : null}

            {error ? (
              <p className="enquiry__error" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="enquiry__row">
            <label className="enquiry__field">
              <span className="enquiry__field-label">
                Name <span aria-hidden="true">*</span>
              </span>
              <input
                type="text"
                name="name"
                value={values.name}
                onChange={setField('name')}
                required
                autoComplete="name"
                aria-invalid={!!fieldErrors.name}
                className={fieldErrors.name ? 'is-invalid' : ''}
              />
              {fieldErrors.name ? (
                <span className="enquiry__field-error">{fieldErrors.name}</span>
              ) : null}
            </label>

            <label className="enquiry__field">
              <span className="enquiry__field-label">
                Email <span aria-hidden="true">*</span>
              </span>
              <input
                type="email"
                name="email"
                value={values.email}
                onChange={setField('email')}
                required
                autoComplete="email"
                aria-invalid={!!fieldErrors.email}
                className={fieldErrors.email ? 'is-invalid' : ''}
              />
              {fieldErrors.email ? (
                <span className="enquiry__field-error">{fieldErrors.email}</span>
              ) : null}
            </label>
          </div>

          <div className="enquiry__row">
            <label className="enquiry__field">
              <span className="enquiry__field-label">Phone</span>
              <input
                type="tel"
                name="phone"
                value={values.phone}
                onChange={setField('phone')}
                autoComplete="tel"
                aria-invalid={!!fieldErrors.phone}
                className={fieldErrors.phone ? 'is-invalid' : ''}
              />
              {fieldErrors.phone ? (
                <span className="enquiry__field-error">{fieldErrors.phone}</span>
              ) : null}
            </label>

            <label className="enquiry__field">
              <span className="enquiry__field-label">Company</span>
              <input
                type="text"
                name="company"
                value={values.company}
                onChange={setField('company')}
                autoComplete="organization"
              />
            </label>
          </div>

          <label className="enquiry__field">
            <span className="enquiry__field-label">
              What are you looking for? <span aria-hidden="true">*</span>
            </span>
            <textarea
              name="message"
              rows={5}
              value={values.message}
              onChange={setField('message')}
              required
              placeholder="Quality, ground fabric, width, approximate quantity — whatever you already know."
              aria-invalid={!!fieldErrors.message}
              className={fieldErrors.message ? 'is-invalid' : ''}
            />
            {fieldErrors.message ? (
              <span className="enquiry__field-error">{fieldErrors.message}</span>
            ) : null}
          </label>

          {/*
            Honeypot. Hidden from sight and from screen readers, and skipped in
            the tab order — only a bot filling every input reaches it, which the
            API rejects.
          */}
          <div className="enquiry__hp" aria-hidden="true">
            <label>
              Website
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <div className="enquiry__actions">
            <button type="submit" className="enquiry__submit" disabled={sending}>
              {buttonLabel}
            </button>

            {sent && !justSent ? (
              <p className="enquiry__previously">
                You sent an enquiry {timeAgo(sent.at) ?? 'recently'}.
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}

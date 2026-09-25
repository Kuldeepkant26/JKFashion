import { useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import * as inventoryApi from '../../../api/inventory.api.js';
import { invalidate } from '../../../api/useCachedQuery.js';
import Modal from '../../components/Modal.jsx';
import DesignImageField from './DesignImageField.jsx';
import { inputClass } from './constants.js';

const FIELDS = [
  { name: 'name', label: 'Company name', placeholder: 'Meera Exports', required: true },
  { name: 'location', label: 'City', placeholder: 'Surat' },
  { name: 'gst', label: 'GST number', placeholder: '24AAAAA0000A1Z5' },
  { name: 'address', label: 'Address', placeholder: 'Street, area', full: true },
];

/** Mirrors the API's cap. */
const MAX_CONTACTS = 10;

const EMPTY_CONTACT = { name: '', phone: '', email: '' };
const EMPTY = { name: '', location: '', gst: '', address: '', contacts: [{ ...EMPTY_CONTACT }] };

const isBlank = (c) => !c.name?.trim() && !c.phone?.trim() && !c.email?.trim();

/** Existing rows come back from the API already structured. */
const fromCompany = (company) => ({
  name: company.name ?? '',
  location: company.location ?? '',
  gst: company.gst ?? '',
  address: company.address ?? '',
  contacts: company.contacts?.length
    ? company.contacts.map((c) => ({
        name: c.name ?? '',
        phone: c.phone ?? '',
        email: c.email ?? '',
      }))
    : [{ ...EMPTY_CONTACT }],
});

const CONTACT_FIELDS = [
  { name: 'name', label: 'Name', placeholder: 'Ramesh Shah', type: 'text' },
  { name: 'phone', label: 'Number', placeholder: '98765 43210', type: 'tel' },
  { name: 'email', label: 'Email', placeholder: 'ramesh@buyer.in', type: 'email' },
];

const labelClass =
  'font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60';

/** Create or edit. The same form either way — only the title and verb differ. */
export default function CompanyForm({ open, initial, onSaved, onCancel, setError }) {
  const editing = Boolean(initial?._id);
  const [form, setForm] = useState(initial ? fromCompany(initial) : EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [contactError, setContactError] = useState('');

  /*
   * The logo is its own upload, saved after the company itself. It is set
   * and removed only here — never picked up from a design image.
   */
  const [logoFile, setLogoFile] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const setContact = (index, key, value) =>
    setForm((f) => ({
      ...f,
      contacts: f.contacts.map((c, i) => (i === index ? { ...c, [key]: value } : c)),
    }));

  const addContact = () =>
    setForm((f) =>
      f.contacts.length >= MAX_CONTACTS
        ? f
        : { ...f, contacts: [...f.contacts, { ...EMPTY_CONTACT }] }
    );

  const removeContact = (index) =>
    setForm((f) => {
      const next = f.contacts.filter((_, i) => i !== index);
      // Never leave the section empty — an add button alone reads as broken.
      return { ...f, contacts: next.length ? next : [{ ...EMPTY_CONTACT }] };
    });

  const submit = async (e) => {
    e.preventDefault();
    setContactError('');

    /*
     * A row with nothing in it is dropped rather than rejected: a company with
     * no contacts at all is allowed, and the spare row the form always shows
     * would otherwise block every save. Only a PARTIALLY filled set is an
     * error, and there is no such thing here — any one field is enough.
     */
    const contacts = form.contacts.filter((c) => !isBlank(c));

    if (contacts.length > MAX_CONTACTS) {
      setContactError(`Add at most ${MAX_CONTACTS} contacts.`);
      return;
    }

    setSaving(true);
    setError('');
    setFieldErrors({});

    const payload = { ...form, contacts };

    try {
      const saved = editing
        ? await inventoryApi.updateCompany(initial._id, payload)
        : await inventoryApi.createCompany(payload);

      if (logoFile) await inventoryApi.setCompanyLogo(saved._id, logoFile);
      else if (removeLogo && editing) await inventoryApi.clearCompanyLogo(saved._id);

      // The order form's buyer picker and the order cards' names read from the
      // same data, so both are dropped along with the company list.
      invalidate('companies', 'orders', 'samples', 'summary', 'company-overview');
      onSaved(editing ? 'Company saved' : 'Company added', saved);
    } catch (err) {
      setError(err?.message ?? 'Could not save that company.');
      setFieldErrors(err.fieldErrors ?? {});

      /* The API reports a bad contact row against `contacts` or a path like
         `contacts[1].email`; surface any of those above the rows. */
      const contactKey = Object.keys(err.fieldErrors ?? {}).find((k) =>
        k.startsWith('contacts')
      );
      if (contactKey) setContactError(err.fieldErrors[contactKey]);
    } finally {
      setSaving(false);
    }
  };

  const formId = editing ? `company-${initial._id}` : 'company-new';

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onCancel}
      title={editing ? 'Edit company' : 'New company'}
      description="Buyers you produce for. Orders are raised against these."
      /* Unsaved typing behind a stray backdrop click is not worth the
         convenience of closing that way. */
      closeOnBackdrop={false}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl px-4 py-2.5 font-body text-sm font-semibold text-brand-ink/70
                       ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5
                       disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={saving}
            className="rounded-xl bg-brand-pink px-5 py-2.5 font-body text-sm font-semibold
                       text-on-primary transition-colors hover:bg-brand-pink-dark
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-brand-pink disabled:opacity-60"
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add company'}
          </button>
        </>
      }
    >
      {/* The submit button lives in the modal footer, outside this element,
          and reaches it by `form=` — so it stays visible however long the
          contact list grows. */}
      <form id={formId} onSubmit={submit} className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <label
              key={f.name}
              className={`flex flex-col gap-1.5 ${f.full ? 'sm:col-span-2' : ''}`}
            >
              <span className={labelClass}>
                {f.label}
                {f.required ? ' *' : ''}
              </span>
              <input
                type="text"
                required={f.required}
                placeholder={f.placeholder}
                value={form[f.name] ?? ''}
                onChange={(e) => set(f.name, e.target.value)}
                className={`${inputClass} ${fieldErrors[f.name] ? 'ring-rose-300' : ''}`}
              />
              {fieldErrors[f.name] ? (
                <span className="text-xs text-rose-600">{fieldErrors[f.name]}</span>
              ) : null}
            </label>
          ))}
        </div>

        <DesignImageField
          label="Company logo"
          existingUrl={initial?.logo?.url}
          file={logoFile}
          onFile={setLogoFile}
          removed={removeLogo}
          onRemovedChange={editing ? setRemoveLogo : undefined}
          setError={setError}
          hint="Shown on this buyer's card and dashboard. Design images are separate and never replace it."
        />

        {/* ------------------------------------------------------ contacts */}
        <fieldset className="flex flex-col gap-3 border-t border-brand-ink/8 pt-4">
          <legend className="sr-only">Contacts</legend>

          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-brand-pink">
              Contacts
            </span>
            <span className="font-body text-xs text-brand-ink/50">
              Name, number or email — any one is enough.
            </span>
          </div>

          {contactError ? (
            <p role="alert" className="text-xs font-semibold text-rose-600">
              {contactError}
            </p>
          ) : null}

          {form.contacts.map((contact, index) => (
            <div
              // Index as key: rows have no id, and removing one is the only
              // reorder that happens — React remounts the tail either way.
              key={index}
              className="grid gap-3 rounded-xl bg-admin-cream p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
            >
              {CONTACT_FIELDS.map((f) => (
                <label key={f.name} className="flex min-w-0 flex-col gap-1.5">
                  <span className={labelClass}>{f.label}</span>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={contact[f.name] ?? ''}
                    onChange={(e) => setContact(index, f.name, e.target.value)}
                    className={inputClass}
                  />
                </label>
              ))}

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeContact(index)}
                  aria-label={`Remove contact ${index + 1}`}
                  disabled={form.contacts.length === 1 && isBlank(contact)}
                  className="grid h-10 w-10 place-items-center rounded-xl text-brand-ink/40
                             transition-colors hover:bg-rose-50 hover:text-rose-600
                             disabled:opacity-30 disabled:hover:bg-transparent
                             disabled:hover:text-brand-ink/40"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {form.contacts.length < MAX_CONTACTS ? (
            <div>
              <button
                type="button"
                onClick={addContact}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-body text-xs
                           font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12
                           transition-colors hover:bg-brand-ink/5"
              >
                <FiPlus aria-hidden /> Add contact
              </button>
            </div>
          ) : null}
        </fieldset>
      </form>
    </Modal>
  );
}

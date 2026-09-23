import { useEffect, useRef, useState } from 'react';
import { FiUploadCloud, FiHash } from 'react-icons/fi';
import * as inventoryApi from '../../../api/inventory.api.js';
import { invalidate } from '../../../api/useCachedQuery.js';
import Modal from '../../components/Modal.jsx';
import {
  ORDER_STATUSES,
  STATUS_LABELS,
  MAX_IMAGE_BYTES,
  IMAGE_ACCEPT,
  inputClass,
  toDateInput,
} from './constants.js';

/**
 * The order's fields, as data.
 *
 * A table plus one renderer keeps them uniform and puts the grouping — which is
 * what the floor actually reads — in one visible place.
 *
 * What is NOT here: the "Floor" group (machine, operator, mendings, rejected,
 * remarks). Those are recorded as the work happens, not when the order is
 * raised, so asking for them on this form only ever produced blanks. They are
 * still shown on the order's detail view, where the history lives.
 */
const SECTIONS = [
  {
    title: 'Order',
    fields: [
      { name: 'designNumber', label: 'Design number', required: true, placeholder: 'D-55' },
      {
        name: 'orderedMetres',
        label: 'Quantity ordered (m)',
        required: true,
        type: 'number',
        step: '0.1',
        min: '0',
      },
      { name: 'status', label: 'Status', type: 'select', options: ORDER_STATUSES },
    ],
  },
  {
    title: 'Fabric & yarn',
    fields: [
      { name: 'fabricType', label: 'Fabric type', placeholder: 'Cambric' },
      { name: 'fabricWidth', label: 'Fabric width', placeholder: '44 inch' },
      { name: 'yarnType', label: 'Yarn type', placeholder: 'Viscose rayon' },
      { name: 'yarnColor', label: 'Yarn colour', placeholder: 'Ivory' },
    ],
  },
  {
    title: 'Schedule',
    fields: [
      { name: 'startDate', label: 'Start date', type: 'date' },
      { name: 'deadline', label: 'Delivery deadline', type: 'date' },
      { name: 'estCompletion', label: 'Est. completion', type: 'date' },
    ],
  },
];

/** `status` opens at SAMPLING — the first state of the lifecycle. */
const EMPTY = {
  companyId: '',
  designNumber: '',
  orderedMetres: '',
  status: 'SAMPLING',
  fabricType: '',
  fabricWidth: '',
  yarnType: '',
  yarnColor: '',
  startDate: '',
  deadline: '',
  estCompletion: '',
};

const fromOrder = (order) => ({
  ...EMPTY,
  ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, order[k] ?? ''])),
  companyId: order.company ?? '',
  startDate: toDateInput(order.startDate),
  deadline: toDateInput(order.deadline),
  estCompletion: toDateInput(order.estCompletion),
});

const labelClass =
  'font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60';

export default function OrderForm({ open, initial, companies, onSaved, onCancel, setError }) {
  const editing = Boolean(initial?._id);
  const [form, setForm] = useState(initial ? fromOrder(initial) : EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  /** The number this order would get — server-generated, shown before saving. */
  const [numberPreview, setNumberPreview] = useState('');

  // Object URLs need revoking, or every preview leaks until a reload.
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  /*
   * Ask the API what the next number for this buyer is, whenever the buyer
   * changes. Only on create: an existing order keeps the number it was issued.
   */
  useEffect(() => {
    if (editing || !form.companyId) {
      setNumberPreview('');
      return undefined;
    }

    let cancelled = false;
    inventoryApi
      .previewOrderNumber(form.companyId)
      .then((result) => {
        if (!cancelled) setNumberPreview(result.orderNumber);
      })
      .catch(() => {
        // The number is still issued on save; a failed preview is not worth a
        // banner over a form the user is part-way through.
        if (!cancelled) setNumberPreview('');
      });

    return () => {
      cancelled = true;
    };
  }, [form.companyId, editing]);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const pickFile = (chosen) => {
    if (!chosen) return;
    if (chosen.size > MAX_IMAGE_BYTES) {
      setError('That image is larger than 8MB. Please choose a smaller file.');
      return;
    }
    setFile(chosen);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setFieldErrors({});
    try {
      if (editing) {
        await inventoryApi.updateOrder(initial._id, form);
        if (file) await inventoryApi.setOrderImage(initial._id, file);
      } else {
        await inventoryApi.createOrder(form, file);
      }

      // The list, the pill counts and the dashboard gauge all move with it.
      invalidate('orders', 'summary');
      onSaved(editing ? 'Order saved' : 'Order created');
    } catch (err) {
      setError(err?.message ?? 'Could not save that order.');
      setFieldErrors(err.fieldErrors ?? {});
    } finally {
      setSaving(false);
    }
  };

  const renderField = (f) => {
    const invalid = fieldErrors[f.name];
    const common = {
      value: form[f.name] ?? '',
      onChange: (e) => set(f.name, e.target.value),
      className: `${inputClass} ${invalid ? 'ring-rose-300' : ''}`,
      required: f.required,
    };

    return (
      <label
        key={f.name}
        className={`flex flex-col gap-1.5 ${f.full ? 'sm:col-span-2 lg:col-span-4' : ''}`}
      >
        <span className={labelClass}>
          {f.label}
          {f.required ? ' *' : ''}
        </span>

        {f.type === 'select' ? (
          <select {...common}>
            {f.options.map((o) => (
              <option key={o} value={o}>
                {STATUS_LABELS[o] ?? o}
              </option>
            ))}
          </select>
        ) : f.type === 'textarea' ? (
          <textarea rows={3} {...common} className={`${common.className} resize-y`} />
        ) : (
          <input
            type={f.type ?? 'text'}
            step={f.step}
            min={f.min}
            placeholder={f.placeholder}
            {...common}
          />
        )}

        {invalid ? <span className="text-xs text-rose-600">{invalid}</span> : null}
      </label>
    );
  };

  const existingImage = initial?.designImage?.url;
  const formId = editing ? `order-${initial._id}` : 'order-new';

  /* What goes in the read-only number box, in priority order. */
  const shownNumber = editing ? initial.orderNumber : numberPreview;

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onCancel}
      title={editing ? `Edit order ${initial.orderNumber}` : 'New production order'}
      description={
        editing
          ? 'Changes apply to this order only.'
          : 'The order number is generated from the buyer when you save.'
      }
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
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create order'}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-5">
        {/* The buyer, the number it produces, and the design image lead — they
            are what identifies an order at a glance on the floor. */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>Buyer *</span>
            <select
              required
              value={form.companyId}
              onChange={(e) => set('companyId', e.target.value)}
              className={`${inputClass} ${fieldErrors.companyId ? 'ring-rose-300' : ''}`}
            >
              <option value="">Choose a company…</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldErrors.companyId ? (
              <span className="text-xs text-rose-600">{fieldErrors.companyId}</span>
            ) : null}
          </label>

          {/* Read-only by design: the server issues the number from an atomic
              per-buyer counter, so two people raising an order at the same
              moment cannot land on the same one. */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>Order number</span>
            <div
              className="flex items-center gap-2 rounded-xl bg-admin-cream px-3.5 py-2.5
                         ring-1 ring-brand-ink/12"
            >
              <FiHash aria-hidden className="shrink-0 text-brand-ink/35" />
              <output
                className={`min-w-0 flex-1 truncate font-body text-sm font-semibold ${
                  shownNumber ? 'text-brand-ink' : 'text-brand-ink/40'
                }`}
              >
                {shownNumber || 'Choose a buyer first'}
              </output>
            </div>
            <span className="font-body text-xs text-brand-ink/45">
              {editing
                ? 'Issued when the order was created.'
                : 'Generated automatically — confirmed on save.'}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-4">
            <span className={labelClass}>Design image</span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-3 rounded-xl bg-admin-cream px-3 py-2 text-left
                         ring-1 ring-brand-ink/12 transition-shadow hover:ring-brand-pink
                         focus-visible:outline-2 focus-visible:outline-offset-2
                         focus-visible:outline-brand-pink"
            >
              {preview || existingImage ? (
                <img
                  src={preview ?? existingImage}
                  alt=""
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-ink/5 text-brand-ink/40">
                  <FiUploadCloud />
                </span>
              )}
              <span className="min-w-0 flex-1 font-body text-xs text-brand-ink/60">
                {file ? file.name : existingImage ? 'Replace image' : 'Choose an image (optional)'}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={IMAGE_ACCEPT}
              className="sr-only"
              onChange={(e) => {
                pickFile(e.target.files?.[0]);
                // Reset so re-picking the same file fires change again.
                e.target.value = '';
              }}
            />
          </div>
        </div>

        {SECTIONS.map((section) => (
          <fieldset key={section.title} className="flex flex-col gap-3">
            <legend className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-brand-pink">
              {section.title}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {section.fields.map(renderField)}
            </div>
          </fieldset>
        ))}

        <p className="font-body text-xs text-brand-ink/50">
          {editing
            ? 'Metres completed are not edited here — they come from the production log, so the total always matches its history.'
            : 'Machine, operator and remarks are recorded against the order as work happens, from its detail view.'}
        </p>
      </form>
    </Modal>
  );
}

import { useEffect, useState } from 'react';
import { FiHash } from 'react-icons/fi';
import * as inventoryApi from '../../../api/inventory.api.js';
import { invalidate } from '../../../api/useCachedQuery.js';
import Modal from '../../components/Modal.jsx';
import DesignImageField from './DesignImageField.jsx';
import {
  SAMPLE_STATUSES,
  SAMPLE_STATUS_LABELS,
  inputClass,
  labelClass,
  toDateInput,
} from './constants.js';

/** The sample's fields as data, grouped the way the floor reads them. */
const SECTIONS = [
  {
    title: 'Sample',
    fields: [
      { name: 'designNumber', label: 'Design number', required: true, placeholder: 'D-55' },
      { name: 'status', label: 'Status', type: 'select' },
      { name: 'quantity', label: 'Sample quantity (m)', type: 'number', step: '0.1', min: '0' },
      { name: 'deadline', label: 'Due to buyer', type: 'date' },
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
    title: 'Repeat & stitches',
    fields: [
      { name: 'repeat', label: 'Repeat (inch)', type: 'number', step: '0.01', min: '0' },
      { name: 'stitches', label: 'Stitches per repeat', type: 'number', step: '1', min: '0' },
    ],
  },
];

const EMPTY = {
  companyId: '',
  designNumber: '',
  status: 'IN_PROGRESS',
  quantity: '',
  deadline: '',
  fabricType: '',
  fabricWidth: '',
  yarnType: '',
  yarnColor: '',
  repeat: '',
  stitches: '',
  remarks: '',
};

const fromSample = (sample) => ({
  ...EMPTY,
  ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, sample[k] ?? ''])),
  companyId: sample.company ?? '',
  deadline: toDateInput(sample.deadline),
});

export default function SampleForm({
  open,
  initial,
  companies,
  /** Inside a company's dashboard the buyer is fixed and not asked for. */
  companyId: fixedCompanyId,
  onSaved,
  onCancel,
  error,
  setError,
}) {
  const editing = Boolean(initial?._id);

  /* A converted sample's status follows its order, so it is shown, not asked for. */
  const inProduction = initial?.status === 'IN_PRODUCTION';

  const [form, setForm] = useState(() =>
    initial ? fromSample(initial) : { ...EMPTY, companyId: fixedCompanyId ?? '' }
  );
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [numberPreview, setNumberPreview] = useState('');

  useEffect(() => {
    if (editing || !form.companyId) {
      setNumberPreview('');
      return undefined;
    }

    let cancelled = false;
    inventoryApi
      .previewSampleNumber(form.companyId)
      .then((r) => !cancelled && setNumberPreview(r.sampleNumber))
      .catch(() => !cancelled && setNumberPreview(''));

    return () => {
      cancelled = true;
    };
  }, [form.companyId, editing]);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setFieldErrors({});
    try {
      if (editing) {
        const { status, ...rest } = form;
        await inventoryApi.updateSample(initial._id, inProduction ? rest : { ...rest, status });
        if (file) await inventoryApi.setSampleImage(initial._id, file);
        else if (removeImage) await inventoryApi.clearSampleImage(initial._id);
      } else {
        await inventoryApi.createSample(form, file);
      }

      invalidate('samples', 'summary', 'companies', 'company-overview');
      onSaved(editing ? 'Sample saved' : 'Sample created');
    } catch (err) {
      setError(err?.message ?? 'Could not save that sample.');
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
      <label key={f.name} className="flex flex-col gap-1.5">
        <span className={labelClass}>
          {f.label}
          {f.required ? ' *' : ''}
        </span>
        {f.type === 'select' && inProduction ? (
          <output className="rounded-xl bg-admin-cream px-3.5 py-2.5 font-body text-sm text-brand-ink/70 ring-1 ring-brand-ink/12">
            {SAMPLE_STATUS_LABELS.IN_PRODUCTION}
          </output>
        ) : f.type === 'select' ? (
          <select {...common}>
            {SAMPLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {SAMPLE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
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

  const formId = editing ? `sample-${initial._id}` : 'sample-new';
  const shownNumber = editing ? initial.sampleNumber : numberPreview;

  return (
    <Modal
      error={error}
      open={open}
      onClose={saving ? undefined : onCancel}
      title={editing ? `Edit sample ${initial.sampleNumber}` : 'New sample'}
      description="Sampling is tracked on its own. To start production, pick the sample from Production → New order."
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
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create sample'}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {fixedCompanyId ? null : (
            <label className="flex flex-col gap-1.5">
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
            </label>
          )}

          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Sample number</span>
            <div className="flex items-center gap-2 rounded-xl bg-admin-cream px-3.5 py-2.5 ring-1 ring-brand-ink/12">
              <FiHash aria-hidden className="shrink-0 text-brand-ink/35" />
              <output
                className={`min-w-0 flex-1 truncate font-body text-sm font-semibold ${
                  shownNumber ? 'text-brand-ink' : 'text-brand-ink/40'
                }`}
              >
                {shownNumber || 'Choose a buyer first'}
              </output>
            </div>
          </div>

          <div className="sm:col-span-2">
            <DesignImageField
              existingUrl={initial?.designImage?.url}
              file={file}
              onFile={setFile}
              removed={removeImage}
              onRemovedChange={editing ? setRemoveImage : undefined}
              setError={setError}
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

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Remarks</span>
          <textarea
            rows={3}
            value={form.remarks}
            onChange={(e) => set('remarks', e.target.value)}
            className={`${inputClass} resize-y`}
            placeholder="What the buyer asked for, changes between rounds…"
          />
        </label>
      </form>
    </Modal>
  );
}

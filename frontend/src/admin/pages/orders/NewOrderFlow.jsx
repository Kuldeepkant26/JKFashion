import { useState } from 'react';
import { FiFilePlus, FiChevronRight } from 'react-icons/fi';
import { TbNeedleThread } from 'react-icons/tb';
import * as inventoryApi from '../../../api/inventory.api.js';
import { useCachedQuery, cacheKey } from '../../../api/useCachedQuery.js';
import Modal from '../../components/Modal.jsx';
import SamplePicker from './SamplePicker.jsx';
import OrderForm from './OrderForm.jsx';
import { SAMPLE_PICKER_LIMIT } from './constants.js';

function Option({ icon: Icon, title, text, meta, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full flex-col gap-3 rounded-2xl bg-surface-card p-4 text-left ring-1
                 ring-brand-ink/10 transition hover:ring-2 hover:ring-brand-pink/50
                 focus-visible:outline-2 focus-visible:outline-offset-2
                 focus-visible:outline-brand-pink"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-pink/12 text-brand-pink">
          <Icon aria-hidden size={20} />
        </span>
        <FiChevronRight
          aria-hidden
          className="text-brand-ink/25 transition-colors group-hover:text-brand-pink"
        />
      </span>
      <span>
        <span className="block font-body text-base font-semibold text-brand-ink">{title}</span>
        <span className="mt-1 block font-body text-xs leading-relaxed text-brand-ink/60">
          {text}
        </span>
      </span>
      {meta ? (
        <span className="mt-auto font-body text-xs font-semibold text-brand-ink/45">{meta}</span>
      ) : null}
    </button>
  );
}

/**
 * "New order": choose how to start, then follow that path.
 *
 *   choose  → two options: from a sample, or create new
 *   samples → pick a sample, then the order form filled in from it
 *   blank   → the order form, empty, for a buyer
 *
 * Each step is its own popup, with a way back to the one before, so the
 * choice is never a dead end.
 *
 * @param companyId      scope to one buyer (inside their dashboard)
 * @param onGoToSampling offered by the sample list when there is nothing to pick
 */
export default function NewOrderFlow({
  companyId,
  companies,
  error,
  setError,
  onClose,
  onCreated,
  onGoToSampling,
}) {
  const [step, setStep] = useState('choose');
  const [picked, setPicked] = useState(null);

  const go = (next) => {
    setError('');
    setPicked(null);
    setStep(next);
  };

  /*
   * The same request the sample list opens with, so the count here is real
   * and the list is already loaded by the time it is chosen.
   */
  const pickerParams = {
    status: 'OPEN',
    companyId: companyId || undefined,
    limit: SAMPLE_PICKER_LIMIT,
  };
  const { data: open } = useCachedQuery(cacheKey('samples', pickerParams), () =>
    inventoryApi.listSamples(pickerParams)
  );

  if (step === 'samples' && picked) {
    return (
      <OrderForm
        open
        key={`from-${picked._id}`}
        fromSample={picked}
        companies={companies}
        companyId={companyId}
        error={error}
        setError={setError}
        onBack={() => {
          setError('');
          setPicked(null);
        }}
        onCancel={onClose}
        onSaved={onCreated}
      />
    );
  }

  if (step === 'samples') {
    return (
      <SamplePicker
        open
        companyId={companyId}
        onPick={(sample) => {
          setError('');
          setPicked(sample);
        }}
        onBack={() => go('choose')}
        onCancel={onClose}
        onGoToSampling={onGoToSampling}
      />
    );
  }

  if (step === 'blank') {
    return (
      <OrderForm
        open
        key="blank"
        companies={companies}
        companyId={companyId}
        error={error}
        setError={setError}
        onBack={() => go('choose')}
        onCancel={onClose}
        onSaved={onCreated}
      />
    );
  }

  const approved = open?.statusCounts?.APPROVED ?? 0;
  const inProgress = open?.statusCounts?.IN_PROGRESS ?? 0;
  const sampleMeta = !open
    ? null
    : approved + inProgress
      ? `${approved} approved · ${inProgress} in progress`
      : 'No samples waiting right now';

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title="New production order"
      description="How do you want to start?"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-4 py-2.5 font-body text-sm font-semibold text-brand-ink/70
                     ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5"
        >
          Cancel
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Option
          icon={TbNeedleThread}
          title="Choose from samples"
          text="Convert a sample the buyer has confirmed. Its design is filled in, and the sample moves to In production."
          meta={sampleMeta}
          onClick={() => go('samples')}
        />
        <Option
          icon={FiFilePlus}
          title="Create new"
          text="Start a blank order for a buyer — a repeat order, or a design that needed no sample."
          onClick={() => go('blank')}
        />
      </div>
    </Modal>
  );
}

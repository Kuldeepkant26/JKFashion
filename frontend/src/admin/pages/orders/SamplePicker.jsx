import { useEffect, useState } from 'react';
import { FiSearch, FiImage, FiChevronRight, FiArrowLeft } from 'react-icons/fi';
import { TbNeedleThread } from 'react-icons/tb';
import * as inventoryApi from '../../../api/inventory.api.js';
import { useCachedQuery, cacheKey } from '../../../api/useCachedQuery.js';
import Modal from '../../components/Modal.jsx';
import Spinner from '../../components/Spinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import {
  SAMPLE_STATUS_LABELS,
  SAMPLE_STATUS_STYLES,
  SAMPLE_PICKER_LIMIT,
  formatDate,
  inputClass,
} from './constants.js';

function SampleRow({ sample, showCompany, onPick }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(sample)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1
                   ring-brand-ink/8 transition hover:bg-brand-ink/[0.03] hover:ring-brand-pink/40
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-brand-pink"
      >
        {sample.designImage?.url ? (
          <img
            src={sample.designImage.url}
            alt={`Design ${sample.designNumber}`}
            className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-brand-ink/8"
          />
        ) : (
          <span
            aria-hidden
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-ink/5 text-brand-ink/30"
          >
            <FiImage />
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="block truncate font-body text-sm font-semibold text-brand-ink">
            {sample.sampleNumber}
            {showCompany ? (
              <span className="font-normal text-brand-ink/60"> · {sample.companyName}</span>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate font-body text-xs text-brand-ink/50">
            {[
              `Design ${sample.designNumber}`,
              [sample.fabricType, sample.yarnColor].filter(Boolean).join(' · '),
              sample.status === 'APPROVED' ? `approved ${formatDate(sample.decidedAt)}` : '',
              sample.status === 'DELIVERED' ? `delivered ${formatDate(sample.deliveredAt)}` : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>

        <span
          className={`hidden shrink-0 rounded-full px-2 py-0.5 font-body text-[10px] font-semibold
                      uppercase tracking-wider sm:inline ${SAMPLE_STATUS_STYLES[sample.status]}`}
        >
          {SAMPLE_STATUS_LABELS[sample.status]}
        </span>
        <FiChevronRight aria-hidden className="shrink-0 text-brand-ink/30" />
      </button>
    </li>
  );
}

function Group({ title, hint, items, showCompany, onPick }) {
  if (!items.length) return null;

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-brand-pink">
          {title} <span className="text-brand-ink/40">({items.length})</span>
        </h3>
        {hint ? <span className="font-body text-xs text-brand-ink/45">{hint}</span> : null}
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((sample) => (
          <SampleRow key={sample._id} sample={sample} showCompany={showCompany} onPick={onPick} />
        ))}
      </ul>
    </section>
  );
}

/**
 * "Choose from samples", the first path of New order: pick the sample the
 * order is for.
 *
 * Samples still open are offered — approved first, since those are what the
 * buyer has said yes to, then the ones delivered and waiting on an answer,
 * then the ones still in progress (converting either records the approval). A sample already in production has its order,
 * and a rejected one has to be reopened first, so neither is listed.
 *
 * @param companyId      scope to one buyer (inside their dashboard)
 * @param onBack         back to the choice between this and "Create new"
 * @param onGoToSampling shown when there is nothing to pick
 */
export default function SamplePicker({
  open,
  companyId,
  onPick,
  onBack,
  onCancel,
  onGoToSampling,
}) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const params = {
    status: 'OPEN',
    companyId: companyId || undefined,
    search: debounced || undefined,
    limit: SAMPLE_PICKER_LIMIT,
  };

  const { data, error, loading } = useCachedQuery(cacheKey('samples', params), () =>
    inventoryApi.listSamples(params)
  );

  const items = data?.items ?? [];
  const approved = items.filter((s) => s.status === 'APPROVED');
  const delivered = items.filter((s) => s.status === 'DELIVERED');
  const inProgress = items.filter((s) => s.status === 'IN_PROGRESS');
  const showCompany = !companyId;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Choose from samples"
      description="Pick the sample this order is for. It moves out of Sampling and into In production."
      footer={
        <>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="mr-auto inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-body
                         text-sm font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12
                         transition-colors hover:bg-brand-ink/5"
            >
              <FiArrowLeft aria-hidden /> Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2.5 font-body text-sm font-semibold text-brand-ink/70
                       ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5"
          >
            Cancel
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <label className="relative">
          <span className="sr-only">Search samples</span>
          <FiSearch
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/35"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={showCompany ? 'Search by design, sample or buyer…' : 'Search by design or sample…'}
            className={`${inputClass} pl-10`}
          />
        </label>

        {error ? (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
            {error.message}
          </p>
        ) : null}

        {loading && !data ? (
          <div className="grid min-h-[30vh] place-items-center">
            <Spinner label="Loading samples" />
          </div>
        ) : items.length ? (
          <>
            <Group
              title="Approved"
              hint="Ready for production"
              items={approved}
              showCompany={showCompany}
              onPick={onPick}
            />
            <Group
              title="Delivered"
              hint="With the buyer — converting one records their approval"
              items={delivered}
              showCompany={showCompany}
              onPick={onPick}
            />
            <Group
              title="In progress"
              hint="Converting one records the buyer's approval"
              items={inProgress}
              showCompany={showCompany}
              onPick={onPick}
            />
            {data.total > items.length ? (
              <p className="font-body text-xs text-brand-ink/50">
                Showing {items.length} of {data.total}. Search to narrow the list.
              </p>
            ) : null}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <EmptyState
              className="w-full"
              icon={TbNeedleThread}
              title={debounced ? 'No samples match that search' : 'No samples to convert'}
              hint={
                debounced
                  ? 'Try a design number, a sample number or a buyer.'
                  : 'Record the sample in Sampling first — or go Back and choose Create new.'
              }
            />
            {!debounced && onGoToSampling ? (
              <button
                type="button"
                onClick={onGoToSampling}
                className="rounded-xl bg-brand-pink px-4 py-2.5 font-body text-sm font-semibold
                           text-on-primary transition-colors hover:bg-brand-pink-dark"
              >
                Go to Sampling
              </button>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  );
}

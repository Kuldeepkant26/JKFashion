import { FiImage } from 'react-icons/fi';
import { SAMPLE_STATUS_LABELS, SAMPLE_STATUS_STYLES, formatDate } from './constants.js';

/** One sample, as a card. */
export default function SampleCard({ sample, onOpen, showCompany = true }) {
  // Overdue outranks the stored status on the badge, as on order cards.
  const badge = sample.isOverdue ? 'OVERDUE' : sample.status;

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(sample)}
        className="flex w-full flex-col gap-3 rounded-2xl bg-surface-card p-4 text-left
                   shadow-sm ring-1 ring-black/5 transition hover:ring-brand-pink/40
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-brand-pink"
      >
        <div className="flex items-start gap-3">
          {sample.designImage?.url ? (
            <img
              src={sample.designImage.url}
              alt={`Design ${sample.designNumber}`}
              className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-brand-ink/8"
            />
          ) : (
            <span
              aria-hidden
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-ink/5 text-brand-ink/30"
            >
              <FiImage />
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span className="block truncate font-body text-sm font-semibold text-brand-ink">
              Design {sample.designNumber}
            </span>
            <span className="mt-0.5 block truncate font-body text-xs text-brand-ink/50">
              {showCompany ? `${sample.companyName} · ` : ''}
              {sample.sampleNumber}
            </span>
          </span>

          <span
            className={`shrink-0 rounded-full px-2 py-0.5 font-body text-[10px] font-semibold
                        uppercase tracking-wider ${SAMPLE_STATUS_STYLES[badge]}`}
          >
            {SAMPLE_STATUS_LABELS[badge]}
          </span>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-body text-xs text-brand-ink/50">
          <span>
            {[sample.fabricType, sample.yarnColor].filter(Boolean).join(' · ') || 'No fabric set'}
          </span>
          <span className={sample.isOverdue ? 'font-semibold text-rose-600' : ''}>
            {sample.status === 'APPROVED' || sample.status === 'REJECTED'
              ? `Answered ${formatDate(sample.decidedAt)}`
              : `Due ${formatDate(sample.deadline)}`}
          </span>
        </div>
      </button>
    </li>
  );
}

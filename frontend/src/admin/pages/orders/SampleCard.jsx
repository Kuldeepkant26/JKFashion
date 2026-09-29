import { FiImage } from 'react-icons/fi';
import { SAMPLE_STATUS_LABELS, SAMPLE_STATUS_STYLES, formatDate } from './constants.js';

/** The one date worth showing for where the sample is. */
const dateLine = (sample) => {
  switch (sample.status) {
    case 'DELIVERED':
      return `Delivered ${formatDate(sample.deliveredAt)}`;
    case 'APPROVED':
      return `Approved ${formatDate(sample.decidedAt)}`;
    case 'REJECTED':
      return `Rejected ${formatDate(sample.decidedAt)}`;
    case 'IN_PRODUCTION':
      return 'Converted to an order';
    default:
      return `Due ${formatDate(sample.deadline)}`;
  }
};

/**
 * One sample, as a card. The sample number leads — it is how the floor and
 * the buyer name the job — with the design and buyer under it.
 *
 * Every row is `w-full`. The card is a <button>, and older Safari does not
 * stretch a button's children to its width: each row shrank to its own
 * content, so a long buyer name pushed the badge off the card and the date
 * line bunched up on the left.
 */
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
        <div className="flex w-full items-start gap-3">
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
            {/* The badge shares the number's line only, so the buyer's name
                below gets the card's full width. */}
            <span className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate font-body text-sm font-semibold text-brand-ink">
                {sample.sampleNumber}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 font-body text-[10px] font-semibold
                            uppercase tracking-wider ${SAMPLE_STATUS_STYLES[badge]}`}
              >
                {SAMPLE_STATUS_LABELS[badge]}
              </span>
            </span>
            <span className="mt-0.5 block truncate font-body text-xs text-brand-ink/50">
              Design {sample.designNumber}
              {showCompany ? ` · ${sample.companyName}` : ''}
            </span>
          </span>
        </div>

        <div className="flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-body text-xs text-brand-ink/50">
          <span>
            {[sample.fabricType, sample.yarnColor].filter(Boolean).join(' · ') || 'No fabric set'}
          </span>
          <span className={sample.isOverdue ? 'font-semibold text-rose-600' : ''}>
            {dateLine(sample)}
          </span>
        </div>
      </button>
    </li>
  );
}

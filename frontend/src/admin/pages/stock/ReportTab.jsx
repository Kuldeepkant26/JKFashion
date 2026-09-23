import { useState } from 'react';
import { FiCalendar } from 'react-icons/fi';
import * as stockApi from '../../../api/stock.api.js';
import { useCachedQuery, cacheKey } from '../../../api/useCachedQuery.js';
import Spinner from '../../components/Spinner.jsx';
import {
  DIRECTION_LABELS,
  DIRECTION_STYLES,
  DIRECTION_SIGN,
  formatQuantity,
  formatRupees,
  inputClass,
  labelClass,
  today,
} from './constants.js';

/**
 * Everything recorded on one day.
 *
 * The client's "Today's Report", with the date free to move — the question is
 * usually about today, but "what did we take in on the 14th" is the same
 * question and wants the same screen.
 */
export default function ReportTab() {
  const [date, setDate] = useState(today());

  const { data, loading } = useCachedQuery(cacheKey('stock-report', { date }), () =>
    stockApi.getReport(date)
  );

  const movements = data?.movements ?? [];
  const expenses = data?.expenses ?? [];

  /* Grouped by item: a day's entries against one material belong together,
     which is also how they would be read off a paper day-book. */
  const byItem = movements.reduce((acc, m) => {
    const key = `${m.category}:${m.itemName}`;
    (acc[key] ??= { name: m.itemName, rows: [] }).rows.push(m);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-surface-card p-5 shadow-sm ring-1 ring-black/5">
        <label className="flex max-w-xs flex-col gap-1.5">
          <span className={labelClass}>
            <FiCalendar aria-hidden className="mr-1.5 inline" />
            Date
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value || today())}
            className={inputClass}
          />
        </label>
      </div>

      {loading ? (
        <div className="grid min-h-[30vh] place-items-center">
          <Spinner label="Loading report" />
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-surface-card p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
              Stock movements
            </h2>

            {Object.keys(byItem).length ? (
              <div className="mt-3 flex flex-col gap-4">
                {Object.entries(byItem).map(([key, group]) => (
                  <div key={key}>
                    <p className="font-body text-sm font-semibold text-brand-ink">
                      {group.name}
                    </p>
                    <ul className="mt-1 flex flex-col">
                      {group.rows.map((m) => {
                        const meta = [];
                        if (m.partyName) meta.push(m.partyName);
                        if (m.challanNo) meta.push(`Challan #${m.challanNo}`);
                        if (m.note) meta.push(m.note);
                        if (m.createdByName) meta.push(m.createdByName);

                        return (
                          <li
                            key={m._id}
                            className={`flex items-center gap-3 border-b border-brand-ink/8 py-2
                                        last:border-0 ${m.isReversed ? 'opacity-55' : ''}`}
                          >
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 font-body text-[10px]
                                          font-semibold uppercase tracking-wider
                                          ${DIRECTION_STYLES[m.direction]}`}
                            >
                              {DIRECTION_LABELS[m.direction]}
                            </span>
                            <span
                              className={`shrink-0 font-body text-sm font-bold ${
                                m.isReversed
                                  ? 'text-brand-ink/50 line-through'
                                  : 'text-brand-ink'
                              }`}
                            >
                              {DIRECTION_SIGN[m.direction]}
                              {formatQuantity(Math.abs(m.quantity))} {m.unit}
                            </span>
                            <span className="min-w-0 flex-1 truncate font-body text-[11px] text-brand-ink/50">
                              {meta.join(' · ')}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 font-body text-sm text-brand-ink/45">
                Nothing moved on this date.
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-surface-card p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
                Expenses
              </h2>
              {expenses.length ? (
                <p className="font-body text-sm font-bold text-brand-ink">
                  {formatRupees(data?.expenseTotal ?? 0)}
                </p>
              ) : null}
            </div>

            {expenses.length ? (
              <ul className="mt-2 flex flex-col">
                {expenses.map((e) => (
                  <li
                    key={e._id}
                    className="flex items-center justify-between gap-3 border-b border-brand-ink/8
                               py-2 last:border-0"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-body text-sm text-brand-ink">
                        {e.description}
                      </span>
                      {e.createdByName ? (
                        <span className="font-body text-[11px] text-brand-ink/45">
                          {e.createdByName}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 font-body text-sm font-semibold text-brand-ink">
                      {formatRupees(e.amountPaise)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 font-body text-sm text-brand-ink/45">
                No expenses on this date.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

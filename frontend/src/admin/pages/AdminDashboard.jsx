import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiInbox, FiArrowRight } from 'react-icons/fi';
import { stats as fetchStats } from '../../api/admin.api.js';
import { useAppStore } from '../../store/useAppStore.js';
import { ROUTES } from '../../constants/routePaths.js';
import StatTile from '../components/StatTile.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Spinner from '../components/Spinner.jsx';

const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * The panel's landing page.
 *
 * Every figure comes from the database. The previous version showed hardcoded
 * zeros next to a "Top Products" table, a "Channels" panel and a traffic chart
 * — placeholders for web analytics this project never collected. Shown to the
 * client they read as real data that happened to be empty, which is a worse
 * answer than not showing them at all, so they are gone rather than restyled.
 */
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const user = useAppStore((s) => s.user);

  useEffect(() => {
    let cancelled = false;

    fetchStats()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 font-body text-sm text-rose-700">
        {error}
      </p>
    );
  }

  if (!data) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner label="Loading dashboard" />
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const recent = data.recentEnquiries ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-1 font-body text-sm text-brand-ink/55">
          Welcome back, {firstName}
        </p>
      </div>

      {/* ------------------------------------------------------- tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {data.tiles.map((tile) => (
          <StatTile
            key={tile.key}
            label={tile.label}
            value={tile.value}
            hint={tile.hint}
            /* Unanswered enquiries are the one number worth acting on today,
               so it is the only one that draws the eye. */
            highlight={tile.key === 'newEnquiries' && tile.value > 0}
          />
        ))}
      </div>

      {/* --------------------------------------------- recent enquiries */}
      <section className="rounded-2xl bg-surface-card p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-brand-ink">Latest enquiries</h2>

          <Link
            to={ROUTES.ADMIN_ENQUIRIES}
            className="inline-flex items-center gap-1.5 font-body text-xs font-semibold
                       text-brand-pink transition-opacity hover:opacity-75"
          >
            View all <FiArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>

        {recent.length ? (
          <ul className="mt-4 flex flex-col gap-1">
            {recent.map((enquiry) => (
              <li key={enquiry.id}>
                <Link
                  to={ROUTES.ADMIN_ENQUIRIES}
                  className="flex items-start gap-3 rounded-xl p-3 transition-colors
                             hover:bg-brand-ink/3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-body text-sm font-semibold text-brand-ink">
                        {enquiry.name}
                      </span>
                      {enquiry.status === 'NEW' ? (
                        <span className="rounded-full bg-brand-pink/12 px-2 py-0.5 font-body
                                         text-[10px] font-semibold uppercase tracking-wider
                                         text-brand-pink">
                          New
                        </span>
                      ) : null}
                      {enquiry.company ? (
                        <span className="font-body text-xs text-brand-ink/40">
                          {enquiry.company}
                        </span>
                      ) : null}
                    </span>

                    <span className="mt-0.5 block truncate font-body text-[13px] text-brand-ink/60">
                      {enquiry.message}
                    </span>
                  </span>

                  <span className="shrink-0 font-body text-[11px] text-brand-ink/40">
                    {formatDate(enquiry.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            className="mt-4 min-h-64"
            icon={FiInbox}
            title="No enquiries yet"
            hint="Messages sent through the website’s enquiry form will appear here."
          />
        )}
      </section>
    </div>
  );
}

import Avatar from './Avatar.jsx';
import EmptyState from './EmptyState.jsx';

/** The "top performers" panel — which products are drawing the most interest. */
export default function TopProducts({ items = [] }) {
  return (
    <section className="rounded-2xl bg-surface-card p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
      <h2 className="font-display text-xl font-bold text-brand-ink">Top products</h2>
      <p className="mt-0.5 font-body text-xs text-brand-ink/45">Most viewed this period</p>

      {items.length ? (
        <ul className="mt-5 flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <Avatar name={item.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-sm font-semibold text-brand-ink">
                  {item.name}
                </p>
                <p className="truncate font-body text-xs text-brand-ink/45">{item.handle}</p>
              </div>
              <span className="font-display text-sm font-bold text-brand-ink">{item.pct}%</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          className="mt-5"
          icon="🧵"
          title="No product data yet"
          hint="Rankings appear once products are tracked."
        />
      )}
    </section>
  );
}

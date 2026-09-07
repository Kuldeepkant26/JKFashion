import EmptyState from './EmptyState.jsx';

/** The bottom panel — per-channel performance, in a tinted well of white cards. */
export default function ChannelsPanel({ items = [] }) {
  return (
    <section className="rounded-2xl bg-brand-pink-soft/12 p-5 ring-1 ring-black/5 sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="lg:w-56 lg:shrink-0">
          <h2 className="font-display text-xl font-bold text-brand-ink">Channels</h2>
          <p className="mt-1.5 font-body text-sm text-brand-ink/55">
            Where your enquiries came from this period.
          </p>
        </div>

        <div className="flex-1">
          {items.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {items.map((channel) => {
                const isUp = channel.deltaPct >= 0;
                return (
                  <div
                    key={channel.id}
                    className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-black/5"
                  >
                    <p className="font-body text-sm font-semibold text-brand-ink">
                      {channel.name}
                    </p>
                    <p className="mt-0.5 truncate font-body text-xs text-brand-ink/45">
                      {channel.handle}
                    </p>
                    <p
                      className={`mt-3 font-display text-2xl font-bold ${
                        isUp ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isUp ? '+' : '−'}
                      {Math.abs(channel.deltaPct)}
                      <span className="text-sm"> %</span>
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="📊"
              title="No channel data yet"
              hint="Enquiry sources appear here once tracking is connected."
            />
          )}
        </div>
      </div>
    </section>
  );
}

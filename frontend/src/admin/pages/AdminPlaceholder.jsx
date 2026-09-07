import EmptyState from '../components/EmptyState.jsx';

/**
 * Stands in for the sections that are navigable but not yet built, so the
 * sidebar links lead somewhere honest rather than a blank screen or a 404.
 */
export default function AdminPlaceholder({ title }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
        {title}
      </h1>

      <EmptyState
        className="min-h-[50vh] bg-surface-card"
        icon="🚧"
        title={`${title} is not built yet`}
        hint="This section is planned for a later pass."
      />
    </div>
  );
}

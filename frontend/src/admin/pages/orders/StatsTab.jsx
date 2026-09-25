import * as inventoryApi from '../../../api/inventory.api.js';
import { useCachedQuery, cacheKey } from '../../../api/useCachedQuery.js';
import Spinner from '../../components/Spinner.jsx';
import InventoryStats from './InventoryStats.jsx';

/**
 * The section's figures, on a tab of their own.
 *
 * They used to sit above the order list, which pushed the orders themselves
 * below the fold on a laptop. Kept within Orders because they are about
 * orders — just no longer in the way of working through them.
 */
export default function StatsTab() {
  const { data: summary, error } = useCachedQuery(cacheKey('summary'), inventoryApi.getSummary);

  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
        {error.message}
      </p>
    );
  }

  if (!summary) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner label="Loading figures" />
      </div>
    );
  }

  return <InventoryStats summary={summary} />;
}

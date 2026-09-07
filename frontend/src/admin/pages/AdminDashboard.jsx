import { useEffect, useState } from 'react';
import { stats as fetchStats } from '../../api/admin.api.js';
import { useAppStore } from '../../store/useAppStore.js';
import StatTile from '../components/StatTile.jsx';
import PromoCard from '../components/PromoCard.jsx';
import ActivityChart from '../components/ActivityChart.jsx';
import TopProducts from '../components/TopProducts.jsx';
import ChannelsPanel from '../components/ChannelsPanel.jsx';
import Spinner from '../components/Spinner.jsx';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState('7d');
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

  return (
    <div className="flex flex-col gap-6">
      {/* ------------------------------------------------ header + tiles */}
      <div className="grid gap-6 xl:grid-cols-[1fr_minmax(0,26rem)]">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-1 font-body text-sm text-brand-ink/55">
            Welcome back, {firstName}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {data.tiles.map((tile) => (
              <StatTile
                key={tile.key}
                label={tile.label}
                value={tile.value}
                deltaPct={tile.deltaPct}
                direction={tile.direction}
              />
            ))}
          </div>
        </div>

        <PromoCard />
      </div>

      {/* ------------------------------------------------ chart + products */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ActivityChart
            points={data.activity.points}
            range={range}
            onRangeChange={setRange}
          />
        </div>
        <TopProducts items={data.topProducts} />
      </div>

      {/* ------------------------------------------------ channels */}
      <ChannelsPanel items={data.channels} />
    </div>
  );
}

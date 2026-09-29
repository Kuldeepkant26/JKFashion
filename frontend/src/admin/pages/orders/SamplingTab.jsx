import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../../constants/routePaths.js';
import SamplesBoard from './SamplesBoard.jsx';
import { SAMPLE_FILTERS } from './constants.js';

/**
 * Every sample, across buyers.
 *
 *   ?open=<id>     opens that sample on arrival
 *   ?status=<s>    starts on that filter (e.g. APPROVED, from the dashboard)
 *   ?new=1         starts the New sample form
 *
 * The last two are read once and then taken out of the address.
 */
export default function SamplingTab() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const [start] = useState(() => {
    const status = params.get('status');
    return {
      status: SAMPLE_FILTERS.some((f) => f.value === status) ? status : 'SAMPLING',
      create: params.get('new') === '1',
    };
  });

  useEffect(() => {
    if (!params.has('status') && !params.has('new')) return;
    const next = new URLSearchParams(params);
    next.delete('status');
    next.delete('new');
    setParams(next, { replace: true });
  }, [params, setParams]);

  return (
    <SamplesBoard
      initialStatus={start.status}
      startNew={start.create}
      focusId={params.get('open') || undefined}
      onFocusDone={() => setParams({}, { replace: true })}
      onOpenOrder={(id) => navigate(`${ROUTES.ADMIN_ORDERS_LIST}?open=${id}`)}
    />
  );
}

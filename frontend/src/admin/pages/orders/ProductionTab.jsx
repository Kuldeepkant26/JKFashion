import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../../constants/routePaths.js';
import OrdersBoard from './OrdersBoard.jsx';
import { FILTERS } from './constants.js';

/**
 * Every production order, across buyers.
 *
 *   ?open=<id>     opens that order on arrival
 *   ?status=<s>    starts on that filter (e.g. OVERDUE, from the dashboard)
 *   ?new=1         starts the New order flow
 *
 * The last two are read once and then taken out of the address, so a refresh
 * does not reopen the form or undo a filter chosen since.
 */
export default function ProductionTab() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const [start] = useState(() => {
    const status = params.get('status');
    return {
      status: FILTERS.some((f) => f.value === status) ? status : '',
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
    <OrdersBoard
      initialStatus={start.status}
      startNew={start.create}
      focusId={params.get('open') || undefined}
      onFocusDone={() => setParams({}, { replace: true })}
      onOpenSample={(id) => navigate(`${ROUTES.ADMIN_ORDERS_SAMPLES}?open=${id}`)}
      onGoToSampling={() => navigate(ROUTES.ADMIN_ORDERS_SAMPLES)}
    />
  );
}

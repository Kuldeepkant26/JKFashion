import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../../constants/routePaths.js';
import OrdersBoard from './OrdersBoard.jsx';

/** Every production order, across buyers. `?open=<id>` opens one on arrival. */
export default function ProductionTab() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  return (
    <OrdersBoard
      focusId={params.get('open') || undefined}
      onFocusDone={() => setParams({}, { replace: true })}
      onOpenSample={(id) => navigate(`${ROUTES.ADMIN_ORDERS_SAMPLES}?open=${id}`)}
      onGoToSampling={() => navigate(ROUTES.ADMIN_ORDERS_SAMPLES)}
    />
  );
}

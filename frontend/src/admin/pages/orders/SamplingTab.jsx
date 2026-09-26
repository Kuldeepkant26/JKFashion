import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../../constants/routePaths.js';
import SamplesBoard from './SamplesBoard.jsx';

/** Every sample, across buyers. `?open=<id>` opens one on arrival. */
export default function SamplingTab() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  return (
    <SamplesBoard
      focusId={params.get('open') || undefined}
      onFocusDone={() => setParams({}, { replace: true })}
      onOpenOrder={(id) => navigate(`${ROUTES.ADMIN_ORDERS_LIST}?open=${id}`)}
    />
  );
}

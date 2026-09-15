import { FiLock } from 'react-icons/fi';
import EmptyState from '../components/EmptyState.jsx';

/**
 * Where an account with no granted sections lands.
 *
 * Exists so that state has somewhere to go. Without it, every guard would
 * redirect to a section the account cannot open, which redirects again — a
 * loop that presents as a blank, frozen panel rather than as a permissions
 * problem anyone could diagnose.
 */
export default function AdminNoAccess() {
  return (
    <EmptyState
      className="min-h-[60vh] bg-surface-card"
      icon={FiLock}
      title="No sections assigned yet"
      hint="Your account can sign in, but has not been given access to any part of the panel. Ask the administrator to grant you a section."
    />
  );
}

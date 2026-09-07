import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login as loginRequest } from '../../api/auth.api.js';
import { useAppStore } from '../../store/useAppStore.js';
import { ROUTES } from '../../constants/routePaths.js';
import { company } from '../../data/site.js';
import logo from '../../assets/jk-fashion-logo.png';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setAuth = useAppStore((s) => s.setAuth);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setSubmitting(true);

    try {
      const { user, accessToken } = await loginRequest({ email, password });
      setAuth({ user, accessToken });

      // Return them to the page they originally asked for, if a guard sent
      // them here from somewhere specific.
      const target = location.state?.from?.pathname ?? ROUTES.ADMIN_DASHBOARD;
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.fieldErrors ?? {});
      setSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full rounded-xl border bg-white px-4 py-3 font-body text-sm text-brand-ink
     outline-none transition-colors placeholder:text-brand-ink/35
     focus-visible:border-brand-pink focus-visible:ring-2 focus-visible:ring-brand-pink/25
     ${fieldErrors[field] ? 'border-rose-400' : 'border-brand-ink/12'}`;

  return (
    <div className="font-body grid min-h-screen place-items-center bg-admin-cream px-5 py-10
                    scroll-auto">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src={logo} alt={company.name} className="h-14 w-auto object-contain" />
          <div>
            <h1 className="font-display text-2xl font-bold text-brand-ink">Admin Panel</h1>
            <p className="mt-1 text-sm text-brand-ink/55">Sign in to manage your site</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-7"
        >
          {error ? (
            // role=alert so a screen reader announces the failure rather than
            // leaving the user waiting on a form that silently did nothing.
            <p
              role="alert"
              className="mb-5 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
            >
              {error}
            </p>
          ) : null}

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-medium text-brand-ink/75">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              placeholder="admin@jkfashion.com"
              className={inputClass('email')}
            />
            {fieldErrors.email ? (
              <span className="mt-1.5 block text-xs text-rose-600">{fieldErrors.email}</span>
            ) : null}
          </label>

          <label className="mb-6 block">
            <span className="mb-1.5 block text-sm font-medium text-brand-ink/75">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className={inputClass('password')}
            />
            {fieldErrors.password ? (
              <span className="mt-1.5 block text-xs text-rose-600">{fieldErrors.password}</span>
            ) : null}
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-brand-pink px-4 py-3 font-body text-sm font-semibold
                       text-white transition-colors hover:bg-brand-pink-dark
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-brand-pink
                       disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-brand-ink/40">
          {company.name} · Admin access only
        </p>
      </div>
    </div>
  );
}

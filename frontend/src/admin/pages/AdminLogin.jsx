import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login as loginRequest } from '../../api/auth.api.js';
import { useAppStore } from '../../store/useAppStore.js';
import { ROUTES } from '../../constants/routePaths.js';
import { company } from '../../data/site.js';
import logo from '../../assets/jk-fashion-logo.png';

const UserIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-5 w-5">
    <path d="M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0 1.5c-3.3 0-6 1.8-6 4v.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V15.5c0-2.2-2.7-4-6-4Z" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-5 w-5">
    <path d="M6 8V6.5a4 4 0 1 1 8 0V8h.5A1.5 1.5 0 0 1 16 9.5v6A1.5 1.5 0 0 1 14.5 17h-9A1.5 1.5 0 0 1 4 15.5v-6A1.5 1.5 0 0 1 5.5 8H6Zm1.5-1.5V8h5V6.5a2.5 2.5 0 0 0-5 0Z" />
  </svg>
);

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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

  const inputClass = (field, extra = '') =>
    `w-full rounded-xl border bg-white py-3 pl-11 font-body text-sm text-brand-ink
     outline-none transition-colors placeholder:text-brand-ink/35
     focus-visible:border-brand-pink focus-visible:ring-2 focus-visible:ring-brand-pink/25
     ${extra} ${fieldErrors[field] ? 'border-rose-400' : 'border-brand-ink/12'}`;

  return (
    <div className="font-body grid min-h-screen lg:grid-cols-2">
      {/*
        Decorative half. Dropped below lg so a phone gets the full width for the
        form rather than scrolling past artwork to reach it.
        Themed: this is the one admin surface that follows the site theme, since
        it has no content that a dark preset could make unreadable.
      */}
      <div
        className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-center lg:p-14"
        style={{ background: 'var(--gradient-brand)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-28 h-104 w-104 rounded-full bg-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-16 h-88 w-88 rounded-full bg-white/5"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-16 -right-24 h-72 w-72 rounded-full bg-white/10"
        />

        <div className="relative">
          {/* The logo is pink-on-transparent, which clashes with most of the 30
              gradients — inverted to white it reads correctly on all of them. */}
          <img
            src={logo}
            alt={company.name}
            className="h-12 w-auto object-contain brightness-0 invert"
          />

          <h2 className="mt-12 font-display text-5xl font-bold tracking-tight text-white xl:text-6xl">
            Welcome
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/80">
            Manage your products, enquiries and site content from one place.
          </p>
        </div>
      </div>

      {/* Form half */}
      <div className="grid place-items-center bg-admin-cream px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          {/* The brand mark only appears here on small screens, where the
              decorative panel that carries it is hidden. */}
          <img
            src={logo}
            alt={company.name}
            className="mb-8 h-12 w-auto object-contain lg:hidden"
          />

          <h1 className="font-display text-3xl font-bold text-brand-ink">Sign in</h1>
          <p className="mt-1.5 text-sm text-brand-ink/55">
            Enter your credentials to access the admin panel.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8">
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
              <span className="relative block">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/35">
                  <UserIcon />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                  placeholder="admin@jkfashion.com"
                  className={inputClass('email', 'pr-4')}
                />
              </span>
              {fieldErrors.email ? (
                <span className="mt-1.5 block text-xs text-rose-600">{fieldErrors.email}</span>
              ) : null}
            </label>

            <label className="mb-4 block">
              <span className="mb-1.5 block text-sm font-medium text-brand-ink/75">Password</span>
              <span className="relative block">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/35">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className={inputClass('password', 'pr-16')}
                />
                {/*
                  type=button is essential: inside a form a bare <button>
                  defaults to submit, so toggling visibility would sign in.
                */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-1.5 py-1
                             text-xs font-semibold tracking-wide text-brand-pink
                             transition-colors hover:text-brand-pink-dark
                             focus-visible:outline-2 focus-visible:outline-offset-2
                             focus-visible:outline-brand-pink"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </span>
              {fieldErrors.password ? (
                <span className="mt-1.5 block text-xs text-rose-600">{fieldErrors.password}</span>
              ) : null}
            </label>

            <div className="mb-6 flex items-center justify-end">
              {/*
                A real control, not a dead link: there is no password-reset flow
                on this API, so it says what to actually do instead of pointing
                at a route that does not exist.
              */}
              <button
                type="button"
                onClick={() => setShowHelp((v) => !v)}
                aria-expanded={showHelp}
                className="text-sm font-medium text-brand-pink transition-colors
                           hover:text-brand-pink-dark focus-visible:outline-2
                           focus-visible:outline-offset-2 focus-visible:outline-brand-pink"
              >
                Forgot password?
              </button>
            </div>

            {showHelp ? (
              <p className="mb-5 rounded-lg bg-brand-pink/8 px-3 py-2.5 text-xs text-brand-ink/70">
                Contact the site owner to have your password reset.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl px-4 py-3 font-body text-sm font-semibold
                         transition-opacity hover:opacity-90
                         focus-visible:outline-2 focus-visible:outline-offset-2
                         focus-visible:outline-brand-pink
                         disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: 'var(--brand-primary)', color: 'var(--on-primary)' }}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-brand-ink/40">
            {company.name} · Admin access only
          </p>
        </div>
      </div>
    </div>
  );
}

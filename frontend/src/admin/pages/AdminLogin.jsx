import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login as loginRequest } from '../../api/auth.api.js';
import { useAppStore } from '../../store/useAppStore.js';
import { ROUTES } from '../../constants/routePaths.js';
import { company } from '../../data/site.js';
import logo from '../../assets/jk-fashion-logo.png';

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-6 w-6">
    <rect x="2.5" y="5" width="19" height="14" rx="3" fill="currentColor" />
    <path
      d="M3.5 7.5 10.8 13a2 2 0 0 0 2.4 0l7.3-5.5"
      stroke="#fff"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-6 w-6">
    <path
      d="M8 10V7.5a4 4 0 1 1 8 0V10"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <rect x="4.5" y="10" width="15" height="11" rx="3.5" fill="currentColor" />
    <circle cx="12" cy="15" r="1.6" fill="#fff" />
    <path d="M12 15.6v2.2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const EyeIcon = ({ off }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-5 w-5">
    <path
      d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.8" />
    {off ? (
      <path d="M4 20 20 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    ) : null}
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

  /**
   * Pill inputs that sit on a white card with a soft coloured glow, rather than
   * a bordered box — the border only appears to mark a field error.
   */
  const inputClass = (field, extra = '') =>
    `w-full rounded-full border bg-white py-4 pl-16 font-body text-[15px] text-ink-light
     shadow-[0_10px_30px_-12px_var(--login-glow)] outline-none transition
     placeholder:text-ink-light/35
     focus-visible:shadow-[0_12px_34px_-10px_var(--login-glow-strong)]
     ${extra} ${fieldErrors[field] ? 'border-rose-300' : 'border-transparent'}`;

  return (
    <div
      className="font-body relative min-h-screen overflow-hidden"
      style={{
        background: 'var(--gradient-wash)',
        // Local aliases so the long shadow utilities above stay readable.
        '--login-glow': 'color-mix(in oklab, var(--brand-primary) 22%, transparent)',
        '--login-glow-strong': 'color-mix(in oklab, var(--brand-primary) 38%, transparent)',
      }}
    >
      {/*
        Decorative waves bleeding off the right edge. Hidden below lg — on a
        phone they would crowd the form rather than frame it.
        Light tints, not the saturated primary: full-strength brand colour over
        this much area is what made the previous version read as heavy.
      */}
      <svg
        aria-hidden
        viewBox="0 0 600 900"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[46%] lg:block"
      >
        <defs>
          <linearGradient id="jkWaveA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand-light)" />
            <stop offset="100%" stopColor="var(--brand-primary)" />
          </linearGradient>
          <linearGradient id="jkWaveB" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--brand-primary)" />
            <stop offset="100%" stopColor="var(--brand-accent)" />
          </linearGradient>
        </defs>

        {/* top-right billow */}
        <path
          fill="url(#jkWaveA)"
          d="M600 0v250c-40 18-78-6-118-2s-70 34-112 28-64-44-104-48-72 22-110 6-56-56-56-84V0Z"
        />
        {/* bottom-right billow */}
        <path
          fill="url(#jkWaveB)"
          d="M600 900H0v-92c46-30 92-58 140-58s76 40 122 34 74-52 122-58 116 30 216 62Z"
        />
      </svg>

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10
                      px-6 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:px-10">
        {/* ---------------------------------------------------- form column */}
        <div className="mx-auto w-full max-w-md">
          <img
            src={logo}
            alt={company.name}
            className="mx-auto mb-8 h-12 w-auto object-contain"
          />

          <div className="text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink-light sm:text-5xl">
              Hello!
            </h1>
            <p className="mt-2 text-[15px] text-ink-light/60">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-10">
            {error ? (
              // role=alert so a screen reader announces the failure rather than
              // leaving the user waiting on a form that silently did nothing.
              <p
                role="alert"
                className="mb-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {error}
              </p>
            ) : null}

            <label className="mb-6 block">
              <span className="sr-only">Email</span>
              <span className="relative block">
                <span
                  className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  <MailIcon />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                  placeholder="E-mail"
                  className={inputClass('email', 'pr-5')}
                />
              </span>
              {fieldErrors.email ? (
                <span className="mt-2 block pl-5 text-xs text-rose-600">{fieldErrors.email}</span>
              ) : null}
            </label>

            <label className="block">
              <span className="sr-only">Password</span>
              <span className="relative block">
                <span
                  className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="Password"
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
                  className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full p-1
                             transition-opacity hover:opacity-70
                             focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </span>
              {fieldErrors.password ? (
                <span className="mt-2 block pl-5 text-xs text-rose-600">
                  {fieldErrors.password}
                </span>
              ) : null}
            </label>

            <div className="mt-4 mb-8 flex items-center justify-end px-2">
              {/*
                A real control, not a dead link: there is no password-reset flow
                on this API, so it says what to actually do instead of pointing
                at a route that does not exist.
              */}
              <button
                type="button"
                onClick={() => setShowHelp((v) => !v)}
                aria-expanded={showHelp}
                className="text-sm font-medium transition-opacity hover:opacity-75
                           focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ color: 'var(--brand-primary)' }}
              >
                Forgot password?
              </button>
            </div>

            {showHelp ? (
              <p
                className="mb-6 rounded-2xl px-4 py-3 text-xs text-ink-light/70"
                style={{ background: 'var(--brand-tint-10)' }}
              >
                Contact the site owner to have your password reset.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mx-auto block w-full max-w-76 rounded-full px-6 py-4 font-body
                         text-sm font-bold uppercase tracking-[0.12em]
                         shadow-[0_14px_30px_-10px_var(--login-glow-strong)]
                         transition hover:-translate-y-0.5 hover:opacity-95
                         focus-visible:outline-2 focus-visible:outline-offset-2
                         disabled:cursor-not-allowed disabled:opacity-60
                         disabled:hover:translate-y-0"
              style={{ background: 'var(--gradient-button)', color: 'var(--on-primary)' }}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-10 text-center text-xs text-ink-light/45">
            {company.name} · Admin access only
          </p>
        </div>

        {/* ------------------------------------------------ welcome column */}
        <div className="hidden text-center lg:block">
          <h2 className="font-display text-5xl font-bold tracking-tight text-ink-light xl:text-6xl">
            Welcome Back!
          </h2>
          <p className="mx-auto mt-8 max-w-md text-lg leading-loose text-ink-light/65">
            Sign in to manage your products, enquiries and site content — and to
            choose the colour theme your visitors see.
          </p>
        </div>
      </div>
    </div>
  );
}

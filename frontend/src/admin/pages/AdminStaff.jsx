import { useCallback, useEffect, useState } from 'react';
import { FiUsers, FiUserPlus, FiKey, FiTrash2, FiX } from 'react-icons/fi';
import * as staffApi from '../../api/staff.api.js';
import { useAppStore } from '../../store/useAppStore.js';
import EmptyState from '../components/EmptyState.jsx';
import Spinner from '../components/Spinner.jsx';

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never';

const inputClass =
  'w-full rounded-xl bg-surface-card px-3.5 py-2.5 font-body text-sm text-brand-ink ' +
  'ring-1 ring-brand-ink/12 transition-shadow placeholder:text-brand-ink/35 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-pink';

/** Create an account. Collapsed until asked for, so the list leads the page. */
function NewStaffForm({ onCreated, onCancel, busy, setBusy, setError }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setFieldErrors({});
    try {
      await staffApi.create(form);
      setForm({ name: '', email: '', password: '' });
      onCreated();
    } catch (err) {
      setError(err?.message ?? 'Could not create that account.');
      setFieldErrors(err.fieldErrors ?? {});
    } finally {
      setBusy(false);
    }
  };

  const field = (name) => ({
    value: form[name],
    onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })),
    className: `${inputClass} ${fieldErrors[name] ? 'ring-rose-300' : ''}`,
  });

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-2xl bg-surface-card p-5 shadow-sm ring-1 ring-black/5"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-brand-ink">New staff account</h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          className="grid h-8 w-8 place-items-center rounded-full text-brand-ink/50
                     transition-colors hover:bg-brand-ink/5 hover:text-brand-ink"
        >
          <FiX />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
            Name
          </span>
          <input type="text" required placeholder="Ravi Kumar" {...field('name')} />
          {fieldErrors.name ? (
            <span className="text-xs text-rose-600">{fieldErrors.name}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
            Email
          </span>
          <input type="email" required placeholder="ravi@example.com" {...field('email')} />
          {fieldErrors.email ? (
            <span className="text-xs text-rose-600">{fieldErrors.email}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
            Password
          </span>
          <input
            type="text"
            required
            placeholder="At least 8 characters"
            autoComplete="new-password"
            {...field('password')}
          />
          {fieldErrors.password ? (
            <span className="text-xs text-rose-600">{fieldErrors.password}</span>
          ) : null}
        </label>
      </div>

      {/* Shown, not masked: the owner has to read this out to the employee. */}
      <p className="font-body text-xs text-brand-ink/50">
        Staff accounts can only use Inventory — they cannot reach Settings, the website
        content, or these accounts. Write the password down before saving; it is not shown
        again.
      </p>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-brand-pink px-5 py-2.5 font-body text-sm font-semibold
                     text-on-primary transition-colors hover:bg-brand-pink-dark
                     focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-brand-pink disabled:opacity-60"
        >
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </div>
    </form>
  );
}

function StaffRow({ member, isSelf, onToggleActive, onResetPassword, onDelete, busy }) {
  // The seeded owner is undeletable by design, so it gets no controls at all.
  const locked = member.isProtected;

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-black/5">
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-body text-sm font-semibold text-brand-ink">{member.name}</span>

          <span
            className={`rounded-full px-2 py-0.5 font-body text-[10px] font-semibold uppercase
                        tracking-wider ${
                          member.role === 'MAIN_ADMIN'
                            ? 'bg-brand-pink/12 text-brand-pink'
                            : 'bg-brand-ink/8 text-brand-ink/60'
                        }`}
          >
            {member.role === 'MAIN_ADMIN' ? 'Owner' : 'Staff'}
          </span>

          {!member.isActive ? (
            <span className="rounded-full bg-rose-50 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider text-rose-700">
              Deactivated
            </span>
          ) : null}

          {isSelf ? (
            <span className="font-body text-xs text-brand-ink/40">(you)</span>
          ) : null}
        </span>

        <span className="mt-0.5 block font-body text-xs text-brand-ink/50">
          {member.email} · Last signed in {formatDate(member.lastLoginAt)}
        </span>
      </span>

      {locked ? (
        <span className="font-body text-xs text-brand-ink/40">Cannot be changed</span>
      ) : (
        <span className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onToggleActive(member)}
            disabled={busy}
            className="rounded-xl px-3 py-2 font-body text-xs font-semibold text-brand-ink/70
                       ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5
                       disabled:opacity-60"
          >
            {member.isActive ? 'Deactivate' : 'Reactivate'}
          </button>

          <button
            type="button"
            onClick={() => onResetPassword(member)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-body text-xs
                       font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12
                       transition-colors hover:bg-brand-ink/5 disabled:opacity-60"
          >
            <FiKey aria-hidden /> Password
          </button>

          <button
            type="button"
            onClick={() => onDelete(member)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-body text-xs
                       font-semibold text-rose-700 ring-1 ring-rose-200 transition-colors
                       hover:bg-rose-50 disabled:opacity-60"
          >
            <FiTrash2 aria-hidden /> Delete
          </button>
        </span>
      )}
    </li>
  );
}

export default function AdminStaff() {
  const user = useAppStore((s) => s.user);

  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);

  const flash = (message) => {
    setNote(message);
    setTimeout(() => setNote(''), 2500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await staffApi.list();
      setItems(result.items);
    } catch (err) {
      setError(err?.message ?? 'Could not load staff accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, successNote) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
      if (successNote) flash(successNote);
    } catch (err) {
      setError(err?.message ?? 'That did not work. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = (member) => {
    const next = !member.isActive;
    if (
      !next &&
      !window.confirm(
        `Deactivate ${member.name}? They will be signed out and cannot sign in again ` +
          `until you reactivate them.`
      )
    ) {
      return;
    }
    return run(
      () => staffApi.update(member._id ?? member.id, { isActive: next }),
      next ? 'Account reactivated' : 'Account deactivated'
    );
  };

  const resetPassword = (member) => {
    // A prompt rather than a bespoke dialog: it is one field on an owner-only
    // screen, and the owner has to read the result out to the employee anyway.
    const password = window.prompt(`New password for ${member.name} (at least 8 characters):`);
    if (password === null) return;
    if (password.trim().length < 8) {
      setError('That password is too short — use at least 8 characters.');
      return;
    }
    return run(
      () => staffApi.setPassword(member._id ?? member.id, password.trim()),
      'Password changed'
    );
  };

  const remove = (member) => {
    if (
      !window.confirm(
        `Delete ${member.name}'s account? This cannot be undone. ` +
          `Deactivating them instead keeps the record.`
      )
    ) {
      return;
    }
    return run(() => staffApi.remove(member._id ?? member.id), 'Account deleted');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
            Staff
          </h1>
          <p className="mt-1 text-sm text-brand-ink/55">
            Who can sign in to this panel. Staff accounts see Inventory only.
          </p>
        </div>

        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-pink px-5 py-2.5
                       font-body text-sm font-semibold text-on-primary transition-colors
                       hover:bg-brand-pink-dark focus-visible:outline-2
                       focus-visible:outline-offset-2 focus-visible:outline-brand-pink"
          >
            <FiUserPlus aria-hidden /> Add staff
          </button>
        ) : null}
      </div>

      {note ? (
        <p role="status" className="text-sm font-semibold text-emerald-600">
          {note}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {adding ? (
        <NewStaffForm
          busy={busy}
          setBusy={setBusy}
          setError={setError}
          onCancel={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            load();
            flash('Account created');
          }}
        />
      ) : null}

      {loading && !items ? (
        <div className="grid min-h-[40vh] place-items-center">
          <Spinner label="Loading staff" />
        </div>
      ) : items?.length ? (
        <ul className="flex flex-col gap-3">
          {items.map((member) => (
            <StaffRow
              key={member.id ?? member._id}
              member={member}
              isSelf={(member.id ?? member._id) === user?.id}
              busy={busy}
              onToggleActive={toggleActive}
              onResetPassword={resetPassword}
              onDelete={remove}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          className="min-h-[40vh] bg-surface-card"
          icon={FiUsers}
          title="No staff accounts yet"
          hint="Add an account for each person who needs to record production."
        />
      )}
    </div>
  );
}

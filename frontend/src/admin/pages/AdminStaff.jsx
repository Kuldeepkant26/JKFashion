import { useCallback, useEffect, useState } from 'react';
import { FiUsers, FiUserPlus, FiKey, FiTrash2, FiX, FiSliders } from 'react-icons/fi';
import * as staffApi from '../../api/staff.api.js';
import { useAppStore } from '../../store/useAppStore.js';
import EmptyState from '../components/EmptyState.jsx';
import Spinner from '../components/Spinner.jsx';
import PermissionPicker from '../components/PermissionPicker.jsx';
import PasswordReveal from '../components/PasswordReveal.jsx';
import { PERMISSIONS } from '../../constants/permissions.js';

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
  // Inventory by default — the access staff had before this was configurable.
  const [permissions, setPermissions] = useState(['INVENTORY']);
  const [fieldErrors, setFieldErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setFieldErrors({});
    try {
      // An empty password field means "generate one" — the API returns it once
      // and the parent shows it. Sending "" would fail the length rule instead.
      const created = await staffApi.create({
        name: form.name,
        email: form.email,
        ...(form.password ? { password: form.password } : {}),
        permissions,
      });
      setForm({ name: '', email: '', password: '' });
      setPermissions(['INVENTORY']);
      onCreated(created);
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
            placeholder="Leave blank to generate"
            autoComplete="new-password"
            {...field('password')}
          />
          {fieldErrors.password ? (
            <span className="text-xs text-rose-600">{fieldErrors.password}</span>
          ) : null}
        </label>
      </div>

      <div>
        <p className="mb-2 font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
          Sections they can open
        </p>
        <PermissionPicker value={permissions} onChange={setPermissions} disabled={busy} />
      </div>

      {/* Shown, not masked: the owner has to read this out to the employee. */}
      <p className="font-body text-xs text-brand-ink/50">
        Leave the password blank and a strong one is generated for you — it is shown once
        after saving so you can pass it on.
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

function StaffRow({
  member,
  isSelf,
  onToggleActive,
  onResetPassword,
  onDelete,
  onPermissions,
  busy,
}) {
  // The seeded owner is undeletable by design, so it gets no controls at all.
  const locked = member.isProtected;
  const [editingAccess, setEditingAccess] = useState(false);
  const [draft, setDraft] = useState(member.permissions ?? []);

  const isOwner = member.role === 'MAIN_ADMIN';

  const saveAccess = async () => {
    await onPermissions(member, draft);
    setEditingAccess(false);
  };

  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-center gap-4">
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

        {/* What they can actually reach, spelled out rather than left to be
            inferred from a checkbox panel that is collapsed by default. */}
        <span className="mt-1 block font-body text-xs text-brand-ink/45">
          {isOwner
            ? 'Full access to everything'
            : member.permissions?.length
              ? `Can open: ${member.permissions
                  .map((p) => PERMISSIONS.find((x) => x.id === p)?.label ?? p)
                  .join(', ')}`
              : 'No sections — they can sign in but see nothing'}
        </span>
      </span>

      {locked ? (
        <span className="font-body text-xs text-brand-ink/40">Cannot be changed</span>
      ) : (
        <span className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft(member.permissions ?? []);
              setEditingAccess((v) => !v);
            }}
            disabled={busy}
            aria-expanded={editingAccess}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-body text-xs
                       font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12
                       transition-colors hover:bg-brand-ink/5 disabled:opacity-60"
          >
            <FiSliders aria-hidden /> Access
          </button>

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
      </div>

      {editingAccess && !locked ? (
        <div className="border-t border-black/5 pt-3">
          <PermissionPicker value={draft} onChange={setDraft} disabled={busy} />

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={saveAccess}
              disabled={busy}
              className="rounded-xl bg-brand-pink px-4 py-2 font-body text-xs font-semibold
                         text-on-primary transition-colors hover:bg-brand-pink-dark
                         disabled:opacity-60"
            >
              Save access
            </button>
            <button
              type="button"
              onClick={() => setEditingAccess(false)}
              disabled={busy}
              className="rounded-xl px-4 py-2 font-body text-xs font-semibold text-brand-ink/65
                         ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5
                         disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
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
  /** A just-set password, held only until the owner dismisses it. */
  const [reveal, setReveal] = useState(null);

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

  /**
   * Set a new password.
   *
   * Existing passwords cannot be shown — they are stored as bcrypt hashes, so
   * the server cannot read one back either. Setting a fresh one and revealing
   * it once is the only way to answer "what is their password", which is what
   * this does: blank generates a strong one, and the result is displayed until
   * the owner dismisses it.
   */
  const resetPassword = async (member) => {
    const typed = window.prompt(
      `New password for ${member.name}.\n\n` +
        `Leave blank to generate a strong one, or type at least 8 characters.`
    );
    if (typed === null) return; // cancelled

    const password = typed.trim();
    if (password && password.length < 8) {
      setError('That password is too short — use at least 8 characters.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const result = await staffApi.setPassword(
        member._id ?? member.id,
        password || undefined
      );
      await load();

      // Only a generated password comes back. One the owner typed is already
      // known to them, and echoing it would put it on screen for no reason.
      if (result?.generatedPassword) {
        setReveal({ name: member.name, password: result.generatedPassword });
      } else {
        flash('Password changed');
      }
    } catch (err) {
      setError(err?.message ?? 'Could not change that password.');
    } finally {
      setBusy(false);
    }
  };

  const savePermissions = (member, permissions) =>
    run(
      () => staffApi.update(member._id ?? member.id, { permissions }),
      `Access updated for ${member.name}`
    );

  const handleCreated = (created) => {
    setAdding(false);
    load();
    if (created?.generatedPassword) {
      setReveal({ name: created.name, password: created.generatedPassword });
    } else {
      flash('Account created');
    }
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

      {/* Above the form and the list, and dismissed by hand — this is the only
          time this value is ever visible. */}
      {reveal ? (
        <PasswordReveal
          name={reveal.name}
          password={reveal.password}
          onDismiss={() => setReveal(null)}
        />
      ) : null}

      {adding ? (
        <NewStaffForm
          busy={busy}
          setBusy={setBusy}
          setError={setError}
          onCancel={() => setAdding(false)}
          onCreated={handleCreated}
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
              onPermissions={savePermissions}
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

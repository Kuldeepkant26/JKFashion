import { useCallback, useState } from 'react';
import * as themeApi from '../../../api/theme.api.js';

/**
 * Save/error/confirmation plumbing shared by every settings tab.
 *
 * Each tab sends only the keys it owns — the API treats an absent key as
 * "leave alone", which is what lets three tabs write to one settings document
 * without clobbering each other.
 *
 * `onSuccess` receives the server's response so the caller can commit whatever
 * the server actually stored rather than what it optimistically sent.
 */
export const useSettingsSave = () => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const flash = useCallback((message) => {
    setNote(message);
    setTimeout(() => setNote(''), 2500);
  }, []);

  const save = useCallback(
    async (patch, { onSuccess, onError, message = 'Saved' } = {}) => {
      setSaving(true);
      setError('');
      try {
        const data = await themeApi.update(patch);
        onSuccess?.(data);
        flash(message);
        return data;
      } catch (err) {
        // The caller reverts: leaving a preview applied after a failed save
        // would show an appearance the site is not actually serving.
        onError?.(err);
        setError(err?.message ?? 'Could not save. Please try again.');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [flash]
  );

  return { saving, error, note, setError, flash, save };
};

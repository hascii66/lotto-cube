import { t } from '../lib/i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HISTORICAL_DATA } from '../data/history';
import { mergeDraws, parseDraws, STORAGE_KEY } from '../lib/data';
import { getHistory } from '../lib/api';
import type { Draw } from '../lib/types';
function load() {
  try {
    const saved =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem('lottolab.draws.v1');
    const personal = saved
      ? parseDraws(JSON.parse(saved)).filter((d) => d.source !== 'seed')
      : [];
    return { draws: mergeDraws(HISTORICAL_DATA, personal, true), warning: '' };
  } catch {
    return {
      draws: HISTORICAL_DATA,
      warning:
        'saved_data_could_not_be_read',
    };
  }
}
export function useDraws() {
  const [state, setState] = useState(load);
  const [freshness, setFreshness] = useState<'checking' | 'current' | 'stale'>(
    'checking',
  );
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const lastAttempt = useRef(0);
  const save = useCallback((incoming: Draw[], replace = false) => {
    const latest = load();
    const merged = mergeDraws(latest.draws, incoming, replace);
    try {
      if (latest.warning) {
        const corrupt = localStorage.getItem(STORAGE_KEY);
        if (corrupt) localStorage.setItem(`${STORAGE_KEY}.recovery`, corrupt);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      throw new Error(
        t(
          'could_not_save_on_this_device',
        ),
      );
    }
    setState({ draws: merged, warning: '' });
    return merged;
  }, []);
  useEffect(() => {
    let active = true;
    let running = false;
    async function check() {
      if (
        !active ||
        running ||
        document.visibilityState === 'hidden' ||
        !navigator.onLine ||
        Date.now() - lastAttempt.current < 30000
      )
        return;
      running = true;
      lastAttempt.current = Date.now();
      setFreshness('checking');
      try {
        const result = await getHistory();
        if (!active) return;
        const personal = load().draws.filter(
          (d) => d.source === 'manual' || d.source === 'import',
        );
        save([...result.draws, ...personal], true);
        setFreshness(result.status);
        setCheckedAt(result.checkedAt);
      } catch {
        if (active) setFreshness('stale');
      } finally {
        running = false;
      }
    }
    void check();
    const onVisible = () => {
      void check();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setState(load());
    };
    window.addEventListener('focus', onVisible);
    window.addEventListener('online', onVisible);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(onVisible, 60000);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('online', onVisible);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
      lastAttempt.current = 0;
    };
  }, [save]);
  return { ...state, save, freshness, checkedAt };
}

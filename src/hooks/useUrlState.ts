import { useEffect, useState } from 'react';
import type { Filters, PrizeType, View } from '../lib/types';

const views: View[] = [
  'overview',
  'three',
  'two',
  'scorer',
  'history',
  'guide',
];
function read() {
  const p = new URLSearchParams(location.search);
  return {
    view: views.includes(p.get('view') as View)
      ? (p.get('view') as View)
      : 'overview',
    limit: ['10', '20', 'all'].includes(p.get('limit') ?? '')
      ? (p.get('limit') as Filters['limit'])
      : 'all',
    prize: ['all', 'top', 'front', 'back'].includes(p.get('prize') ?? '')
      ? (p.get('prize') as PrizeType)
      : 'all',
    weekday: /^(all|[0-6])$/.test(p.get('weekday') ?? '')
      ? p.get('weekday')!
      : 'all',
    query: p.get('q')?.slice(0, 30) ?? '',
    page: Math.max(1, Math.min(1000, Number(p.get('page')) || 1)),
  };
}
export function useUrlState() {
  const [state, setState] = useState(read);
  useEffect(() => {
    const onPop = () => setState(read());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const update = (patch: Partial<ReturnType<typeof read>>, push = false) => {
    const next = { ...read(), ...patch };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next))
      if (value !== '') params.set(key === 'query' ? 'q' : key, String(value));
    window.history[push ? 'pushState' : 'replaceState'](null, '', `?${params}`);
    setState(next);
  };
  return [state, update] as const;
}

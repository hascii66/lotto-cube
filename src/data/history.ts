import history from '../../data/lotto-history.json';
import { parseDraws } from '../lib/data';

export const HISTORICAL_DATA = parseDraws(history).map((draw) => ({
  ...draw,
  source: 'sanook' as const,
}));

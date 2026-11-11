export interface Draw {
  date: string;
  prize1: string;
  front3: [string, string];
  back3: [string, string];
  last2: string;
  source?: 'seed' | 'api' | 'manual' | 'import' | 'sanook';
}

export type PrizeType = 'all' | 'top' | 'front' | 'back';
export type AnalysisWindow = number;
export type View =
  'overview' | 'three' | 'two' | 'scorer' | 'history' | 'guide';
export interface Filters {
  limit: AnalysisWindow | `${number}`;
  prize: PrizeType;
  weekday: string;
}
export interface Occurrence {
  number: string;
  label: string;
  date: string;
}

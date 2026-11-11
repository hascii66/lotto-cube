import { SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getLanguage, t, tx } from '../lib/i18n';
import { prizeLabels } from '../lib/analytics';
import { formatNumber, weekdays } from '../lib/format';
import type { AnalysisWindow, PrizeType } from '../lib/types';

type Props = {
  limit: AnalysisWindow;
  prize: PrizeType;
  weekday: string;
  count: number;
  max: number;
  showPrize: boolean;
  onLimitChange: (limit: AnalysisWindow) => void;
  onPrizeChange: (prize: PrizeType) => void;
  onWeekdayChange: (weekday: string) => void;
};

export function AnalysisFilters({
  limit,
  prize,
  weekday,
  count,
  max,
  showPrize,
  onLimitChange,
  onPrizeChange,
  onWeekdayChange,
}: Props) {
  return (
    <div className="filter-bar">
      <div className="filter-label">
        <SlidersHorizontal size={17} />
        <span>{tx('analysis_period')}</span>
      </div>
      <AnalysisWindowSelect
        id="filter-limit"
        limit={limit}
        max={max}
        onChange={onLimitChange}
      />
      {showPrize && (
        <div className="filter-control filter-prize">
          <label className="sr-only" htmlFor="filter-prize">
            {tx('award_type')}
          </label>
          <select
            id="filter-prize"
            value={prize}
            onChange={(event) => onPrizeChange(event.target.value as PrizeType)}
          >
            {Object.entries(prizeLabels()).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="filter-control">
        <label htmlFor="filter-weekday" className="sr-only">
          {tx('draw_weekday')}
        </label>
        <select
          id="filter-weekday"
          value={weekday}
          onChange={(event) => onWeekdayChange(event.target.value)}
        >
          <option value="all">{tx('any_weekday')}</option>
          {weekdays().map((day, index) => (
            <option key={day} value={index}>
              {getLanguage() === 'th' ? `วัน${day}` : day}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-result">
        <span className="status-dot" />
        {tx('using')}
        {count}
        {tx('draws')}
      </div>
    </div>
  );
}

export function AnalysisWindowSelect({
  id,
  limit,
  max,
  onChange,
  className = 'filter-control',
  showLabel = false,
}: {
  id: string;
  limit: AnalysisWindow;
  max: number;
  onChange: (limit: AnalysisWindow) => void;
  className?: string;
  showLabel?: boolean;
}) {
  const [draft, setDraft] = useState(String(limit));
  useEffect(() => setDraft(String(limit)), [limit]);

  function commit() {
    const parsed = Number(draft);
    if (draft.trim() === '' || !Number.isInteger(parsed)) {
      setDraft(String(limit));
      return;
    }
    const next = Math.min(Math.max(1, parsed), Math.max(1, max));
    setDraft(String(next));
    onChange(next);
  }

  return (
    <div className={className}>
      <label htmlFor={id} className={showLabel ? 'pick-draw-label' : 'sr-only'}>
        {tx(showLabel ? 'analysis_window' : 'draw_count')}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={1}
        max={Math.max(1, max)}
        step={1}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        aria-describedby={`${id}-hint`}
      />
      <span id={`${id}-hint`} className="sr-only">
        {t('latest_draws_range', [formatNumber(Math.max(1, max))])}
      </span>
    </div>
  );
}

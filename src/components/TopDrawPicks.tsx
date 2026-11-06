import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Check,
  Info,
} from 'lucide-react';
import { findOccurrences, picksForDraw } from '../lib/analytics';
import { formatDate, formatNumber } from '../lib/format';
import { t } from '../lib/i18n';
import type { Draw } from '../lib/types';
import type { View } from '../lib/types';
import { Empty, Formula, Modal, Panel } from './ui';

export function TopDrawPicks({
  draws,
  targetDate,
  onTargetChange,
  digits,
  onDigitsChange,
  onNavigate,
}: {
  draws: Draw[];
  targetDate: string;
  onTargetChange: (date: string) => void;
  digits: '2' | '3' | '6';
  onDigitsChange: (digits: '2' | '3' | '6') => void;
  onNavigate: (view: View) => void;
}) {
  const { target, history, groups } = useMemo(
    () => picksForDraw(draws, targetDate),
    [draws, targetDate],
  );
  const past = targetDate !== 'next';
  const dates = useMemo(
    () =>
      draws
        .map((draw) => draw.date)
        .sort()
        .reverse(),
    [draws],
  );
  const cutoff = history.reduce(
    (latest, draw) => (draw.date > latest ? draw.date : latest),
    '',
  );
  const leadingPick = groups.find((group) => String(group.digits) === digits)
    ?.picks[0]?.number;
  const label = (digits: 2 | 3 | 6) =>
    digits === 2
      ? t('last_two_digits')
      : digits === 3
        ? t('last_three_digits')
        : t('first_prize_six_exact');
  const [selected, setSelected] = useState<{
    number: string;
    digits: 2 | 3 | 6;
  } | null>(null);
  useEffect(() => setSelected(null), [targetDate, digits]);
  const hits = selected
    ? findOccurrences(
        history,
        [selected.number],
        selected.digits === 3 ? 'back' : 'all',
      )
    : [];
  return (
    <section className="top-last-section" aria-labelledby="top-last-title">
      <div className="top-last-heading">
        <div className="top-last-title">
          <span className="top-last-icon" aria-hidden="true">
            <ChartNoAxesColumnIncreasing size={22} />
          </span>
          <div>
            <h2 id="top-last-title">
              {past ? t('ten_historical_picks') : t('ten_next_draw_picks')}
            </h2>
          </div>
        </div>
        <label className="pick-draw-control" htmlFor="pick-draw">
          <span className="pick-draw-label">{t('choose_draw_for_picks')}</span>
          <span className="pick-draw-select-wrap">
            <CalendarDays size={20} aria-hidden="true" />
            <select
              id="pick-draw"
              value={targetDate}
              onChange={(event) => onTargetChange(event.target.value)}
            >
              <option value="next">
                {draws[0]
                  ? t('next_draws', [
                      formatNumber(draws.length),
                      formatDate(draws[0].date, true),
                    ])
                  : t('next_draw_use_latest_history')}
              </option>
              {past && !target && (
                <option value={targetDate} disabled>
                  {t('draw_not_found', [targetDate])}
                </option>
              )}
              {dates.map((date) => (
                <option key={date} value={date}>
                  {formatDate(date, true)}
                </option>
              ))}
            </select>
          </span>
        </label>
        <p aria-live="polite">
          {past
            ? t('based_on_earlier_draws_history_through', [
                formatNumber(history.length),
                cutoff ? formatDate(cutoff, true) : '—',
              ])
            : t('across_all_stored_draws_ranked_by', [
                formatNumber(draws.length),
              ])}
        </p>
      </div>
      <div
        className="segmented pick-awards"
        role="group"
        aria-label={t('choose_pick_category')}
      >
        {(['2', '3', '6'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={digits === value}
            className={digits === value ? 'selected' : ''}
            onClick={() => onDigitsChange(value)}
          >
            {value === '2'
              ? t('last_two_number')
              : value === '3'
                ? t('last_three_number')
                : t('six_exact_digits')}
          </button>
        ))}
      </div>
      <p className="pick-score-note">
        <Info size={22} aria-hidden="true" />
        {digits === '2' && leadingPick
          ? t('ranks_by_per_digit_frequency_not', [
              leadingPick,
            ])
          : past
            ? t('earlier_draws_score_is_not_winning', [
                formatNumber(history.length),
              ])
            : t('frequency_by_digit_score_not_odds')}
      </p>
      <nav className="wayfinding" aria-label={t('quick_links_to_analysis_sections')}>
        {(
          [
            { view: 'overview', label: t('picks'), detail: t('start') },
            { view: 'three', label: t('three_digits'), detail: '' },
            { view: 'two', label: t('two_digits'), detail: '' },
            { view: 'scorer', label: t('check_numbers'), detail: '' },
            { view: 'history', label: t('archive'), detail: t('destination') },
          ] as const
        ).map(({ view, label, detail }, index) => (
          <a
            key={view}
            href={`?view=${view}`}
            className={`wayfinding-stop wayfinding-stop-${index + 1}${view === 'overview' ? ' wayfinding-start' : ''}`}
            aria-current={view === 'overview' ? 'page' : undefined}
            onClick={(event) => {
              event.preventDefault();
              onNavigate(view);
            }}
          >
            <span className="wayfinding-dot" aria-hidden="true" />
            <span className="wayfinding-label">{label}</span>
            {detail && <span className="wayfinding-detail">{detail}</span>}
          </a>
        ))}
      </nav>
      {past && (
        <p className="pick-backtest-note">
          {t(
            'reconstructed_with_today_s_formula_and',
          )}
        </p>
      )}
      {past && !target ? (
        <Empty>{t('this_draw_is_not_in_the')}</Empty>
      ) : (
        <div className="top-last-panels">
          {groups
            .filter((group) => String(group.digits) === digits)
            .map(({ digits, picks, actual, matched }) => {
              return (
                <Panel
                  key={digits}
                  className={`top-last-card${digits === 6 ? ' top-last-six' : ''}`}
                  title={label(digits)}
                  aside={
                    <span className="mini-tag">{t('historical_index_100')}</span>
                  }
                >
                  {target && (
                    <div className="pick-comparison">
                      <span>
                        {t('actual_result')}{' '}
                        <strong className="mono">{actual.join(' · ')}</strong>
                      </span>
                      <span>
                        {history.length
                          ? t('top_10_matches_awards', [
                              matched.length,
                              actual.length,
                            ])
                          : t('no_earlier_history_to_evaluate')}
                      </span>
                    </div>
                  )}
                  {picks.length ? (
                    <ol
                      className="top-last-grid"
                      aria-label={t('10_picks', [label(digits)])}
                    >
                      {picks.map(({ number, score }, index) => (
                        <li key={number}>
                          <button
                            className={`top-last-number ${index === 0 ? 'top-last-leader' : ''}${matched.includes(number) ? ' top-last-match' : ''}`}
                            onClick={() => setSelected({ number, digits })}
                            aria-label={
                              t('rank_number_score_view_history', [
                                index + 1,
                                label(digits),
                                number,
                                formatNumber(Math.round(score * 10) / 10),
                              ]) +
                              (matched.includes(number)
                                ? ` · ${t('matches_actual_result')}`
                                : '')
                            }
                          >
                            <span className="top-last-rank">
                              <span className="mono">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                              {matched.includes(number) ? (
                                <Check
                                  size={12}
                                  className="pick-match-icon"
                                  aria-label={t('matches_actual_result')}
                                />
                              ) : (
                                <ArrowUpRight size={12} aria-hidden="true" />
                              )}
                            </span>
                            <strong className="mono">{number}</strong>
                            <span className="top-last-score-wrap">
                              <span className="top-last-count-label">
                                {t('score')}
                              </span>
                              <span className="top-last-count">
                                {formatNumber(Math.round(score * 10) / 10)}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <Empty>
                      {past
                        ? t(
                            'no_earlier_history_to_score_choose',
                          )
                        : t(
                            'no_history_to_score_yet_add',
                          )}
                    </Empty>
                  )}
                </Panel>
              );
            })}
        </div>
      )}
      <Formula nextDraw />
      <p className="top-last-footnote">
        {t(
          'score_note_disclaimer',
        )}
      </p>
      {selected && (
        <Modal
          title={t('history', [
            label(selected.digits),
            selected.number,
          ])}
          description={t(
            'occurrences_across_the_draws_used_for',
            [hits.length, formatNumber(history.length)],
          )}
          onClose={() => setSelected(null)}
        >
          {hits.length ? (
            <ul className="hit-list">
              {hits.map((hit, index) => (
                <li key={`${hit.date}-${index}`}>
                  <b className="mono">{hit.number}</b>
                  <span>{hit.label}</span>
                  <time dateTime={hit.date}>{formatDate(hit.date, true)}</time>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>
              {t(
                'no_exact_match_in_this_award',
              )}
            </Empty>
          )}
          <div className="modal-actions">
            <button className="button" onClick={() => setSelected(null)}>
              {t('close')}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

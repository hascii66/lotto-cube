import { t, tx } from '../lib/i18n';
import {
  ShieldCheck,
  ArrowUpRight,
  ChartNoAxesCombined,
  Database,
  Layers3,
  Sigma,
} from 'lucide-react';
import type { Draw } from '../lib/types';
import type { ThreeStats } from '../lib/analytics';
import { formatDate, formatNumber } from '../lib/format';
import { topPicks } from '../lib/analytics';
import { Formula, Panel, TextLink } from './ui';
import { Patterns, Positions, SumChart } from './Charts';
export function LatestDraw({
  draw,
  total,
  onHistory,
}: {
  draw: Draw;
  total: number;
  onHistory: () => void;
}) {
  return (
    <div className="latest-row">
      <section className="draw-ticket" aria-label={t('latest_stored_draw')}>
        <div className="ticket-main">
          <div className="ticket-heading">
            <span>
              <i />
              {tx('latest_stored_draw')}
            </span>
            <time dateTime={draw.date}>{formatDate(draw.date)}</time>
          </div>
          <div className="ticket-prize">
            <div>
              <span className="ticket-label">{tx('first_prize')}</span>
              <div className="prize-digits mono">
                {[...draw.prize1].map((digit, i) => (
                  <span key={i}>{digit}</span>
                ))}
              </div>
            </div>
            <div className="ticket-last">
              <span className="ticket-label">{tx('last_two_digits')}</span>
              <strong className="mono">{draw.last2}</strong>
            </div>
          </div>
          <div className="ticket-bottom">
            <span>GOVERNMENT LOTTERY / THAILAND</span>
            <button
              onClick={onHistory}
              aria-label={t('view_all_historical_draws')}
            >
              <ArrowUpRight size={19} />
            </button>
          </div>
        </div>
        <div className="ticket-stub">
          <div>
            <span>{tx('front_3_digits')}</span>
            <strong className="mono">{draw.front3.join(' · ')}</strong>
          </div>
          <div>
            <span>{tx('last_three_digits')}</span>
            <strong className="mono">{draw.back3.join(' · ')}</strong>
          </div>
          <div className="stub-lines" aria-hidden="true" />
        </div>
      </section>
      <section className="context-card">
        <span className="eyebrow">{tx('know_your_numbers')}</span>
        <h2>
          {tx('read_the_past')}
          <br />
          {tx('see_more_clearly')}
          <span>.</span>
        </h2>
        <p>
          {tx('start_with')}
          {formatNumber(total)}
          {tx('stored_draws_2')}
          <br />
          {tx('explore_patterns_with_transparent_statistics')}
        </p>
        <span className="automatic-label">
          <ShieldCheck size={15} />
          {tx('new_draws_update_automatically')}
        </span>
      </section>
    </div>
  );
}
export function Metrics({
  stats,
  draws,
}: {
  stats: ThreeStats;
  draws: Draw[];
}) {
  const unique = new Set(stats.values).size;
  const sumMax = Math.max(...stats.sums);
  const items = [
    {
      label: t('draws_analyzed'),
      value: formatNumber(draws.length),
      unit: t('draws'),
      note: draws.length
        ? `${formatDate(draws[draws.length - 1].date, true)} – ${formatDate(draws[0].date, true)}`
        : t('no_draws_in_this_period'),
      icon: Database,
    },
    {
      label: t('three_digit_samples'),
      value: formatNumber(stats.total),
      unit: t('samples'),
      note: t('based_on_the_selected_award_type'),
      icon: Layers3,
    },
    {
      label: t('distinct_three_digit_numbers'),
      value: formatNumber(unique),
      unit: t('numbers'),
      note: t('out_of_1_000_possible_numbers'),
      icon: ChartNoAxesCombined,
    },
    {
      label: t('most_frequent_digit_sum_2'),
      value: stats.total
        ? String(stats.sums.indexOf(sumMax)).padStart(2, '0')
        : '—',
      unit: t('points'),
      note: stats.total
        ? t('found_times_in_this_period', [sumMax])
        : t('no_data_to_calculate'),
      icon: Sigma,
    },
  ];
  return (
    <div className="metric-grid">
      {items.map(({ label, value, unit, note, icon: Icon }) => (
        <section className="metric" key={label}>
          <div className="metric-label">
            <span>{label}</span>
            <Icon size={17} />
          </div>
          <div className="metric-value">
            <strong className="mono">{value}</strong>
            <span>{unit}</span>
          </div>
          <small>{note}</small>
        </section>
      ))}
    </div>
  );
}
export function ThreeAnalytics({
  stats,
  onScore,
}: {
  stats: ThreeStats;
  onScore: (n: string) => void;
}) {
  const picks = topPicks(stats);
  return (
    <>
      <Positions positions={stats.positions} total={stats.total} />
      <div className="analysis-grid">
        <Patterns stats={stats} />
        <SumChart stats={stats} />
      </div>
      <Panel
        title={t('10_numbers_aligned_with_the_data')}
        eyebrow="STATISTICAL SHORTLIST"
        aside={<span className="mini-tag">{tx('historical_index_100')}</span>}
      >
        <p className="section-description">
          {tx(
            'ranked_by_position_frequency_digit_sum',
          )}
        </p>
        <div className="picks-grid">
          {picks.map((pick, i) => (
            <button
              className="pick"
              key={pick.number}
              onClick={() => onScore(pick.number)}
              aria-label={t('explore_ranking_score', [
                pick.number,
                pick.score.toFixed(1),
              ])}
            >
              <span className="pick-rank mono">
                {String(i + 1).padStart(2, '0')}
              </span>
              <b className="mono">{pick.number}</b>
              <ArrowUpRight size={16} />
              <span className="pick-score mono">
                {pick.score.toFixed(1)}
                <small>{tx('score')}</small>
              </span>
            </button>
          ))}
        </div>
        <Formula picks />
        <div className="shortlist-note">
          <span>
            {tx('higher_scores_reflect_past_frequencies_not')}
          </span>
          <TextLink onClick={() => onScore('')}>{tx('explore_your_numbers')}</TextLink>
        </div>
      </Panel>
    </>
  );
}

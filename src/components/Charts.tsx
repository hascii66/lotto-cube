import { tx, t } from '../lib/i18n';
import { useId } from 'react';
import { percent } from '../lib/format';
import type { ThreeStats } from '../lib/analytics';
import { Panel } from './ui';
export function PositionChart({
  counts,
  label,
  position,
}: {
  counts: number[];
  label: string;
  position: string;
}) {
  const total = counts.reduce((a, b) => a + b, 0);
  const max = Math.max(20, ...counts.map((c) => percent(c, total)));
  const leaders = counts
    .map((count, digit) => ({ count, digit }))
    .sort((a, b) => b.count - a.count || a.digit - b.digit)
    .slice(0, 3)
    .filter((v) => v.count > 0);
  const top = new Set(leaders.map((l) => l.digit));
  const id = useId();
  return (
    <div className="position-chart">
      <div className="position-title">
        <h3>{label}</h3>
        <span className="mono">{position}</span>
      </div>
      <div className="chart-plot">
        <div className="chart-y-label">{max.toFixed(0)}%</div>
        <div
          className="chart-baseline"
          style={{ bottom: `${(10 / max) * 100}%` }}
        >
          <span>10%</span>
        </div>
        <div className="chart-bars" role="img" aria-labelledby={id}>
          {counts.map((count, digit) => (
            <div className="bar-column" key={digit}>
              <div
                className={`bar ${top.has(digit) ? 'bar-top' : ''}`}
                style={{ height: `${(percent(count, total) / max) * 100}%` }}
              >
                <span className="bar-value">{count}</span>
              </div>
              <span className="bar-label mono">{digit}</span>
            </div>
          ))}
        </div>
      </div>
      <p id={id} className="sr-only">
        {tx('frequency')}
        {label}:{' '}
        {counts
          .map((c, i) =>
            t('occurrences', [i, c, percent(c, total).toFixed(1)]),
          )
          .join(', ')}{' '}
        {tx('expected_share_10_per_digit')}
      </p>
      <div className="chart-leaders">
        <span>{tx('most_frequent')}</span>
        {leaders.length ? (
          leaders.map((l) => (
            <span className="leader" key={l.digit}>
              <b className="mono">{l.digit}</b>
              <span>{percent(l.count, total).toFixed(1)}%</span>
            </span>
          ))
        ) : (
          <span>{tx('no_data')}</span>
        )}
      </div>
    </div>
  );
}
export function Positions({
  positions,
  total,
  two = false,
}: {
  positions: number[][];
  total: number;
  two?: boolean;
}) {
  return (
    <Panel
      title={t('frequency_by_position')}
      eyebrow="POSITIONAL FREQUENCY"
      aside={
        <span className="chart-legend">
          <i />
          {tx('top_three')}
          <span className="legend-rule" />
          {tx('expected_10')}
        </span>
      }
    >
      <div className={`position-grid ${two ? 'two-positions' : ''}`}>
        {positions.map((counts, i) => (
          <PositionChart
            key={i}
            counts={counts}
            label={
              (two
                ? [t('tens'), t('units')]
                : [t('hundreds'), t('tens'), t('units')])[i]
            }
            position={
              (two ? ['TENS', 'UNITS'] : ['HUNDREDS', 'TENS', 'UNITS'])[i]
            }
          />
        ))}
      </div>
      <div className="panel-footnote">
        {tx('based_on')}
        {two ? '2' : '3'}
        {tx('digits')}
        {total.toLocaleString('th-TH')}
        {tx('samples_observed_shares_for_the_selected')}
      </div>
    </Panel>
  );
}
export function Patterns({ stats }: { stats: ThreeStats }) {
  const rows = [
    {
      key: 'unique' as const,
      name: t('distinct_digits'),
      example: 'ABC',
      expected: 72,
    },
    {
      key: 'double' as const,
      name: t('one_repeated_pair'),
      example: 'AAB',
      expected: 27,
    },
    { key: 'triple' as const, name: t('three_identical_digits'), example: 'AAA', expected: 1 },
  ];
  return (
    <Panel
      title={t('number_patterns_2')}
      eyebrow="PATTERN BREAKDOWN"
      aside={<span className="mini-tag">{tx('theoretical_comparison')}</span>}
    >
      <div className="pattern-list">
        {rows.map((row) => {
          const actual = percent(stats.patterns[row.key], stats.total);
          const notable =
            stats.total > 0 && Math.abs(actual - row.expected) >= 10;
          return (
            <div className="pattern-row" key={row.key}>
              <span className="pattern-example mono">{row.example}</span>
              <div className="pattern-content">
                <div>
                  <span>{row.name}</span>
                  <b className="mono">
                    {actual.toFixed(1)}
                    <small>%</small>
                  </b>
                </div>
                <div className="pattern-track">
                  <span style={{ width: `${actual}%` }} />
                  <i style={{ left: `${row.expected}%` }} />
                </div>
                <div className="pattern-meta">
                  <span>
                    {tx('baseline')}
                    {row.expected}% · {stats.patterns[row.key]}
                    {tx('samples')}
                  </span>
                  <span className={notable ? 'notable' : ''}>
                    {notable ? t('difference_10_points') : t('within_threshold')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="split-stats">
        <div>
          <span>
            {tx('low')}
            <small>000–499</small>
          </span>
          <b className="mono">{percent(stats.low, stats.total).toFixed(1)}%</b>
          <small>
            {tx('high')}
            {percent(stats.total - stats.low, stats.total).toFixed(1)}%
          </small>
        </div>
        <div>
          <span>
            {tx('even_sum')}
            <small>{tx('digit_sum')}</small>
          </span>
          <b className="mono">{percent(stats.even, stats.total).toFixed(1)}%</b>
          <small>
            {tx('odd_sum')}
            {percent(stats.total - stats.even, stats.total).toFixed(1)}%
          </small>
        </div>
      </div>
    </Panel>
  );
}
export function SumChart({ stats }: { stats: ThreeStats }) {
  const max = Math.max(1, ...stats.sums);
  const peak = stats.sums.indexOf(max);
  const theoretical = Array.from({ length: 28 }, () => 0);
  for (let n = 0; n < 1000; n++)
    theoretical[
      [...String(n).padStart(3, '0')].reduce((s, d) => s + Number(d), 0)
    ]++;
  return (
    <Panel
      title={t('three_digit_sums')}
      eyebrow="DIGIT SUM DISTRIBUTION"
      aside={<span className="mini-tag">{tx('0_27_points')}</span>}
    >
      <div className="sum-summary">
        <strong className="mono">{stats.total ? peak : '—'}</strong>
        <div>
          <span>{tx('most_frequent_digit_sum')}</span>
          <small>
            {stats.total
              ? t('samples_of_the_data', [
                  max,
                  percent(max, stats.total).toFixed(1),
                ])
              : t('no_data_for_this_period')}
          </small>
        </div>
        <span className="sum-symbol" aria-hidden="true">
          Σ
        </span>
      </div>
      <div
        className="sum-chart"
        role="img"
        aria-label={t('digit_sum_frequency', [
          stats.sums
            .map((count, sum) => t('sum_occurrences', [sum, count]))
            .join(', '),
        ])}
      >
        {stats.sums.map((count, sum) => (
          <div key={sum} className="sum-column">
            <div
              className={`sum-bar ${count === max ? 'sum-peak' : ''}`}
              style={{ height: `${(count / max) * 100}%` }}
              title={t('sum_samples_theoretical', [
                sum,
                count,
                percent(count, stats.total).toFixed(1),
                theoretical[sum] / 10,
              ])}
            />
            <span className="mono">
              {sum % 3 === 0 || sum === 27 ? sum : ''}
            </span>
          </div>
        ))}
      </div>
      <div className="sum-axis">
        <span>{tx('low_sum')}</span>
        <span>{tx('hundreds_tens_units')}</span>
        <span>{tx('high_sum')}</span>
      </div>
      <p className="subtle-note">
        {tx(
          'middle_sums_have_more_possible_combinations',
        )}
      </p>
    </Panel>
  );
}

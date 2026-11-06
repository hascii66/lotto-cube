import { t, tx } from '../lib/i18n';
import { useMemo, useState } from 'react';
import { ArrowUpRight, Grid2X2 } from 'lucide-react';
import { analyzeTwo, findOccurrences } from '../lib/analytics';
import type { Draw } from '../lib/types';
import { formatDate } from '../lib/format';
import { Empty, Modal, Panel, TextLink } from './ui';
import { Positions } from './Charts';
export function TwoAnalytics({
  draws,
  onScore,
}: {
  draws: Draw[];
  onScore: (number: string) => void;
}) {
  const stats = useMemo(() => analyzeTwo(draws), [draws]);
  const [selected, setSelected] = useState<string | null>(null);
  const [group, setGroup] = useState('frequent');
  const groups = [
    {
      id: 'frequent',
      label: t('most_frequent_2'),
      values: stats.counts.filter((v) => v.count > 0 && v.count === stats.max),
    },
    {
      id: 'once',
      label: t('once'),
      values: stats.counts.filter((v) => v.count === 1),
    },
    {
      id: 'never',
      label: t('not_observed'),
      values: stats.counts.filter((v) => !v.count),
    },
  ];
  const hits = selected === null ? [] : findOccurrences(draws, [selected]);
  return (
    <>
      <Panel
        title={t('frequency_map_00_99')}
        eyebrow="2-DIGIT FREQUENCY MAP"
        aside={<Grid2X2 size={21} className="text-accent" />}
      >
        <div className="heatmap-intro">
          <p>
            {tx('darker_cells_mean_more_occurrences_tap')}
          </p>
          <div className="heat-legend">
            <span>{tx('not_found_2')}</span>
            {[0, 1, 2, 3].map((i) => (
              <i key={i} className={`heat-level-${i}`} />
            ))}
            <span>{tx('most_frequent')}</span>
          </div>
        </div>
        <div className="heatmap-layout">
          <div className="heatmap-axis">{tx('tens_units')}</div>
          <div className="heatmap">
            {stats.counts.map(({ number, count }) => (
              <button
                key={number}
                className={`heat-cell mono heat-level-${count === 0 ? 0 : Math.ceil((count / Math.max(1, stats.max)) * 3)}`}
                onClick={() => setSelected(number)}
                aria-label={t('number_occurrences_view_history', [
                  number,
                  count,
                ])}
              >
                <span>{number}</span>
                <small>{count || '—'}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="panel-footnote">
          {tx('last_two_digit_awards_only')}
          {draws.length}
          {tx('draws_2')} {stats.counts.filter((v) => v.count > 0).length}
          {tx('distinct_numbers_observed_out_of_100')}
        </div>
      </Panel>
      <Positions positions={stats.positions} total={draws.length} two />
      <Panel title={t('explore_by_frequency')} eyebrow="FREQUENCY GROUPS">
        <div className="segmented group-tabs">
          {groups.map((g) => (
            <button
              key={g.id}
              aria-pressed={group === g.id}
              className={group === g.id ? 'selected' : ''}
              onClick={() => setGroup(g.id)}
            >
              {g.label} <span>{g.values.length}</span>
            </button>
          ))}
        </div>
        <div className="number-cloud">
          {groups
            .find((g) => g.id === group)!
            .values.map((v) => (
              <button
                key={v.number}
                className="number-chip mono"
                onClick={() => setSelected(v.number)}
              >
                {v.number}
                <small>
                  {v.count}
                  {tx('times')}
                </small>
              </button>
            ))}
        </div>
        {!groups.find((g) => g.id === group)!.values.length && (
          <Empty>{tx('no_numbers_in_this_group_try')}</Empty>
        )}
        <p className="subtle-note">
          {tx('not_observed_means_absent_only_within')}
        </p>
      </Panel>
      <div className="inline-cta">
        <div>
          <h3>{tx('have_a_two_digit_number_in')}</h3>
          <p>{tx('explore_position_scores_and_reversed_number')}</p>
        </div>
        <TextLink onClick={() => onScore('')}>
          {tx('open_number_explorer')}
        </TextLink>
      </div>
      {selected !== null && (
        <Modal
          title={t('history_for', [selected])}
          description={t('last_2_digits_selected_draws', [
            draws.length,
          ])}
          onClose={() => setSelected(null)}
        >
          {hits.length ? (
            <ul className="hit-list">
              {hits.map((hit, i) => (
                <li key={i}>
                  <b className="mono">{hit.number}</b>
                  <span>{hit.label}</span>
                  <time dateTime={hit.date}>{formatDate(hit.date)}</time>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>
              {tx('no_matches_for_2')}
              {selected}
              {tx('in_this_period_select_more_draws')}
            </Empty>
          )}
          <div className="modal-actions">
            <button className="button" onClick={() => setSelected(null)}>
              {tx('close')}
            </button>
            <button
              className="button button-primary"
              onClick={() => {
                onScore(selected);
                setSelected(null);
              }}
            >
              {tx('check_this_number')}
              <ArrowUpRight size={16} />
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

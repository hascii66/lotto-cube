import { ArrowUpRight, BookOpen } from 'lucide-react';
import { t, tx } from '../lib/i18n';
import { Formula, Panel } from './ui';

export function GuidePage() {
  return (
    <div className="guide-grid">
      <Panel
        title={t('start_with_traceable_data')}
        eyebrow="DATA PROVENANCE"
        aside={<BookOpen size={22} />}
      >
        <p>{tx('the_app_uses_ten_years_of')}</p>
        <p>{tx('latest_draw_means_the_newest_result')}</p>
        <p>
          {tx('results_from')}{' '}
          <a
            href="https://news.sanook.com/lotto/archive/"
            target="_blank"
            rel="noreferrer"
          >
            Sanook archive <ArrowUpRight size={13} />
          </a>{' '}
          {tx('an_external_source_always_verify_prize')}
        </p>
        <p>{tx('the_server_maintains_the_shared_archive')}</p>
      </Panel>
      <Panel
        title={t('read_the_charts_with_confidence')}
        eyebrow="READING THE NUMBERS"
      >
        <ul className="reading-guide">
          <li>
            <b>{tx('frequency_by_position')}</b>
            <span>{tx('digits_0_9_are_counted_in')}</span>
          </li>
          <li>
            <b>{tx('number_patterns')}</b>
            <span>{tx('of_all_numbers_000_999_72')}</span>
          </li>
          <li>
            <b>{tx('low_high_and_even_odd')}</b>
            <span>{tx('low_means_000_499_and_high')}</span>
          </li>
          <li>
            <b>{tx('filter_by_weekday')}</b>
            <span>{tx('weekday_filtering_comes_first_then_the')}</span>
          </li>
        </ul>
      </Panel>
      <Panel
        title={t('scores_are_not_predictions')}
        eyebrow="TRANSPARENT BY DESIGN"
      >
        <p>{tx('scores_describe_historical_alignment_only_a')}</p>
        <Formula picks />
        <div className="info-box">
          {tx('small_samples_can_fluctuate_substantially_always')}
        </div>
      </Panel>
    </div>
  );
}

import { t, tx } from '../lib/i18n';
import { ChevronLeft, ChevronRight, Download, Plus } from 'lucide-react';
import type { Draw } from '../lib/types';
import { formatDate } from '../lib/format';
import { exportJson } from '../lib/data';
import { Empty, Panel, SearchField } from './ui';
function Highlight({ value, query }: { value: string; query: string }) {
  if (!query || !value.includes(query)) return <>{value}</>;
  return (
    <>
      {value.split(query).map((part, i) => (
        <span key={i}>
          {i > 0 && <mark>{query}</mark>}
          {part}
        </span>
      ))}
    </>
  );
}
export function History({
  draws,
  query,
  page,
  onQuery,
  onPage,
  onAdd,
}: {
  draws: Draw[];
  query: string;
  page: number;
  onQuery: (q: string) => void;
  onPage: (p: number) => void;
  onAdd: () => void;
}) {
  const matching = draws.filter((d) =>
    [d.prize1, ...d.front3, ...d.back3, d.last2].some((n) =>
      n.includes(query.trim()),
    ),
  );
  const totalPages = Math.max(1, Math.ceil(matching.length / 10));
  const current = Math.min(totalPages, Math.max(1, Math.floor(page)));
  const start = (current - 1) * 10;
  const sources = {
    sanook: 'Sanook',
    seed: t('original_dataset'),
    api: 'Rayriffy API',
    manual: t('added_manually'),
    import: t('import_json'),
  };
  return (
    <Panel
      title={t('historical_draws')}
      eyebrow="DRAW ARCHIVE"
      aside={
        <button className="button button-small" onClick={onAdd}>
          <Plus size={15} />
          {tx('add_draw')}
        </button>
      }
    >
      <div className="table-toolbar">
        <SearchField value={query} onChange={onQuery} />
        <button
          className="button button-small"
          onClick={() => exportJson(draws)}
        >
          <Download size={15} />
          {tx('export_all')}
        </button>
      </div>
      <p className="table-summary" aria-live="polite">
        {t(
          'found_of_draws_in_the_archive',
          [matching.length, draws.length],
        )}
      </p>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label={t('results_table_scroll_horizontally_to_see')}
      >
        <table>
          <caption className="sr-only">
            {tx('historical_thai_government_lottery_results')}
          </caption>
          <thead>
            <tr>
              <th scope="col">{tx('draw_date')}</th>
              <th scope="col">{tx('first_prize')}</th>
              <th scope="col">{tx('front_3_digits')}</th>
              <th scope="col">{tx('last_three_digits')}</th>
              <th scope="col">{tx('last_two_number')}</th>
              <th scope="col">{tx('source')}</th>
            </tr>
          </thead>
          <tbody>
            {matching.slice(start, start + 10).map((d) => (
              <tr key={d.date}>
                <td>
                  <time dateTime={d.date}>{formatDate(d.date, true)}</time>
                </td>
                <td className="mono prize-one">
                  <Highlight value={d.prize1} query={query.trim()} />
                </td>
                <td className="mono">
                  {d.front3.map((n, i) => (
                    <span className="table-number" key={i}>
                      <Highlight value={n} query={query.trim()} />
                    </span>
                  ))}
                </td>
                <td className="mono">
                  {d.back3.map((n, i) => (
                    <span className="table-number" key={i}>
                      <Highlight value={n} query={query.trim()} />
                    </span>
                  ))}
                </td>
                <td className="mono">
                  <span className="last-two">
                    <Highlight value={d.last2} query={query.trim()} />
                  </span>
                </td>
                <td>
                  <span className="source-label">
                    {sources[d.source ?? 'import']}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!matching.length && (
          <Empty>
            {tx('no_matches_for')}
            {query}
            {tx('try_another_number_or_clear_the')}
          </Empty>
        )}
      </div>
      <div className="pagination">
        <span>
          {matching.length
            ? `${start + 1}–${Math.min(start + 10, matching.length)}`
            : '0'}{' '}
          {tx('of')}
          {matching.length}
          {tx('draws')}
        </span>
        <div>
          <button
            className="icon-button"
            aria-label={t('previous_page')}
            disabled={current === 1}
            onClick={() => onPage(current - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <span>
            {t('page_2', [current, totalPages])}
          </span>
          <button
            className="icon-button"
            aria-label={t('next_page')}
            disabled={current >= totalPages}
            onClick={() => onPage(current + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </Panel>
  );
}

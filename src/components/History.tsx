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
    seed: t('ข้อมูลตั้งต้น'),
    api: 'Rayriffy API',
    manual: t('เพิ่มเอง'),
    import: t('นำเข้า JSON'),
  };
  return (
    <Panel
      title={t('ผลสลากย้อนหลัง')}
      eyebrow="DRAW ARCHIVE"
      aside={
        <button className="button button-small" onClick={onAdd}>
          <Plus size={15} />
          {tx('เพิ่มงวด')}
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
          {tx('ส่งออกทั้งหมด')}
        </button>
      </div>
      <p className="table-summary" aria-live="polite">
        {t(
          'พบ {0} งวดจากฐานข้อมูลทั้งหมด {1} งวด · ค้นหาได้ทุกรางวัล',
          [matching.length, draws.length],
        )}
      </p>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label={t('ตารางผลสลาก เลื่อนแนวนอนเพื่อดูทุกรางวัล')}
      >
        <table>
          <caption className="sr-only">
            {tx('ผลสลากกินแบ่งรัฐบาลย้อนหลัง')}
          </caption>
          <thead>
            <tr>
              <th scope="col">{tx('วันที่ออกรางวัล')}</th>
              <th scope="col">{tx('รางวัลที่ 1')}</th>
              <th scope="col">{tx('เลขหน้า 3 ตัว')}</th>
              <th scope="col">{tx('เลขท้าย 3 ตัว')}</th>
              <th scope="col">{tx('ท้าย 2 ตัว')}</th>
              <th scope="col">{tx('แหล่งข้อมูล')}</th>
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
            {tx('ไม่พบเลข “')}
            {query}
            {tx('” ลองค้นหาเลขอื่น หรือล้างคำค้นหาเพื่อดูทั้งหมด')}
          </Empty>
        )}
      </div>
      <div className="pagination">
        <span>
          {matching.length
            ? `${start + 1}–${Math.min(start + 10, matching.length)}`
            : '0'}{' '}
          {tx('จาก')}
          {matching.length}
          {tx('งวด')}
        </span>
        <div>
          <button
            className="icon-button"
            aria-label={t('หน้าก่อนหน้า')}
            disabled={current === 1}
            onClick={() => onPage(current - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <span>
            {t('หน้า {0} / {1}', [current, totalPages])}
          </span>
          <button
            className="icon-button"
            aria-label={t('หน้าถัดไป')}
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

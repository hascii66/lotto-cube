import { useState } from 'react';
import { ArrowUpRight, ChartNoAxesColumnIncreasing } from 'lucide-react';
import { findOccurrences, topLastNumbers } from '../lib/analytics';
import { formatDate, formatNumber } from '../lib/format';
import { t } from '../lib/i18n';
import type { Draw } from '../lib/types';
import { Empty, Modal, Panel } from './ui';

export function TopLastNumbers({ draws }: { draws: Draw[] }) {
  const [selected, setSelected] = useState<{
    number: string;
    digits: 2 | 3;
  } | null>(null);
  const hits = selected
    ? findOccurrences(
        draws,
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
            <span className="eyebrow">THE MOST FREQUENT / TOP 10</span>
            <h2 id="top-last-title">{t('Top 10 เลขท้ายที่ออกบ่อย')}</h2>
          </div>
        </div>
        <p>
          {t('จากฐานข้อมูลทั้งหมด {0} งวด · เรียงตามจำนวนครั้งที่ออกจริง', [
            formatNumber(draws.length),
          ])}
        </p>
      </div>
      <div className="top-last-panels">
        {([2, 3] as const).map((digits) => {
          const ranking = topLastNumbers(draws, digits);
          return (
            <Panel
              key={digits}
              className="top-last-card"
              title={digits === 2 ? t('เลขท้าย 2 ตัว') : t('เลขท้าย 3 ตัว')}
              aside={
                <span className="mini-tag">
                  {t('{0} ชุด/งวด', [digits === 2 ? 1 : 2])}
                </span>
              }
            >
              {ranking.length ? (
                <ol
                  className="top-last-grid"
                  aria-label={t('10 อันดับเลขท้าย {0} ตัวที่ออกบ่อย', [digits])}
                >
                  {ranking.map(({ number, count }, index) => (
                    <li key={number}>
                      <button
                        className={`top-last-number ${index === 0 ? 'top-last-leader' : ''}`}
                        onClick={() => setSelected({ number, digits })}
                        aria-label={t(
                          'อันดับ {0} เลขท้าย {1} ตัว {2} ออก {3} ครั้ง ดูประวัติ',
                          [index + 1, digits, number, count],
                        )}
                      >
                        <span className="top-last-rank">
                          <span className="mono">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <ArrowUpRight size={12} aria-hidden="true" />
                        </span>
                        <strong className="mono">{number}</strong>
                        <span className="top-last-count">
                          {t('{0} ครั้ง', [formatNumber(count)])}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <Empty>{t('ยังไม่มีเลขท้ายในฐานข้อมูล')}</Empty>
              )}
            </Panel>
          );
        })}
      </div>
      <p className="top-last-footnote">
        {t(
          'แตะตัวเลขเพื่อดูงวดที่เคยออก · หากความถี่เท่ากันเรียงตามเลข · สถิติย้อนหลังไม่ใช่การทำนาย',
        )}
      </p>
      {selected && (
        <Modal
          title={t('ประวัติเลขท้าย {0} ตัว {1}', [
            selected.digits,
            selected.number,
          ])}
          description={t(
            'พบ {0} ครั้งจากฐานข้อมูลทั้งหมด {1} งวด · นับเฉพาะรางวัลเลขท้าย',
            [hits.length, formatNumber(draws.length)],
          )}
          onClose={() => setSelected(null)}
        >
          <ul className="hit-list">
            {hits.map((hit, index) => (
              <li key={`${hit.date}-${index}`}>
                <b className="mono">{hit.number}</b>
                <span>{hit.label}</span>
                <time dateTime={hit.date}>{formatDate(hit.date, true)}</time>
              </li>
            ))}
          </ul>
          <div className="modal-actions">
            <button className="button" onClick={() => setSelected(null)}>
              {t('ปิด')}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

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
      label: t('ออกบ่อยที่สุด'),
      values: stats.counts.filter((v) => v.count > 0 && v.count === stats.max),
    },
    {
      id: 'once',
      label: t('ออก 1 ครั้ง'),
      values: stats.counts.filter((v) => v.count === 1),
    },
    {
      id: 'never',
      label: t('ยังไม่เคยออก'),
      values: stats.counts.filter((v) => !v.count),
    },
  ];
  const hits = selected === null ? [] : findOccurrences(draws, [selected]);
  return (
    <>
      <Panel
        title={t('แผนที่ความถี่ 00–99')}
        eyebrow="2-DIGIT FREQUENCY MAP"
        aside={<Grid2X2 size={21} className="text-accent" />}
      >
        <div className="heatmap-intro">
          <p>
            {tx('สีเข้มแสดงเลขที่พบมากกว่า · แตะตัวเลขเพื่อดูงวดที่เคยออก')}
          </p>
          <div className="heat-legend">
            <span>{tx('ไม่พบ')}</span>
            {[0, 1, 2, 3].map((i) => (
              <i key={i} className={`heat-level-${i}`} />
            ))}
            <span>{tx('พบบ่อย')}</span>
          </div>
        </div>
        <div className="heatmap-layout">
          <div className="heatmap-axis">{tx('หลักสิบ ↓ · หลักหน่วย →')}</div>
          <div className="heatmap">
            {stats.counts.map(({ number, count }) => (
              <button
                key={number}
                className={`heat-cell mono heat-level-${count === 0 ? 0 : Math.ceil((count / Math.max(1, stats.max)) * 3)}`}
                onClick={() => setSelected(number)}
                aria-label={t('เลข {0} ออก {1} ครั้ง ดูประวัติ', [
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
          {tx('นับเฉพาะรางวัลเลขท้าย 2 ตัว ·')}
          {draws.length}
          {tx('งวด ·')} {stats.counts.filter((v) => v.count > 0).length}
          {tx('เลขที่เคยพบจากทั้งหมด 100 เลข')}
        </div>
      </Panel>
      <Positions positions={stats.positions} total={draws.length} two />
      <Panel title={t('สำรวจตามความถี่')} eyebrow="FREQUENCY GROUPS">
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
                  {tx('ครั้ง')}
                </small>
              </button>
            ))}
        </div>
        {!groups.find((g) => g.id === group)!.values.length && (
          <Empty>{tx('ไม่มีเลขในกลุ่มนี้ ลองเลือกกลุ่มอื่น')}</Empty>
        )}
        <p className="subtle-note">
          {tx('เลขที่ยังไม่เคยออก หมายถึงไม่พบเฉพาะในช่วงที่เลือกเท่านั้น')}
        </p>
      </Panel>
      <div className="inline-cta">
        <div>
          <h3>{tx('มีเลข 2 ตัวในใจ?')}</h3>
          <p>{tx('ดูคะแนนรายหลักและประวัติเลขกลับในที่เดียว')}</p>
        </div>
        <TextLink onClick={() => onScore('')}>
          {tx('เปิดเครื่องมือตรวจเลข')}
        </TextLink>
      </div>
      {selected !== null && (
        <Modal
          title={t('ประวัติเลข {0}', [selected])}
          description={t('เลขท้าย 2 ตัว · ในช่วงที่เลือก {0} งวด', [
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
              {tx('ยังไม่พบเลข')}
              {selected}
              {tx('ในช่วงที่เลือก ลองขยายจำนวนงวดเพื่อดูข้อมูลเพิ่ม')}
            </Empty>
          )}
          <div className="modal-actions">
            <button className="button" onClick={() => setSelected(null)}>
              {tx('ปิด')}
            </button>
            <button
              className="button button-primary"
              onClick={() => {
                onScore(selected);
                setSelected(null);
              }}
            >
              {tx('ตรวจคะแนนเลขนี้')}
              <ArrowUpRight size={16} />
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

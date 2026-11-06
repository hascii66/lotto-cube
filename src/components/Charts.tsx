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
        {tx('ความถี่')}
        {label}:{' '}
        {counts
          .map((c, i) =>
            t('{0} ออก {1} ครั้ง ({2}%)', [i, c, percent(c, total).toFixed(1)]),
          )
          .join(', ')}{' '}
        {tx('ค่าคาดหวังเลขละ 10%')}
      </p>
      <div className="chart-leaders">
        <span>{tx('พบบ่อย')}</span>
        {leaders.length ? (
          leaders.map((l) => (
            <span className="leader" key={l.digit}>
              <b className="mono">{l.digit}</b>
              <span>{percent(l.count, total).toFixed(1)}%</span>
            </span>
          ))
        ) : (
          <span>{tx('ไม่มีข้อมูล')}</span>
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
      title={t('ความถี่รายหลัก')}
      eyebrow="POSITIONAL FREQUENCY"
      aside={
        <span className="chart-legend">
          <i />
          {tx('3 อันดับแรก')}
          <span className="legend-rule" />
          {tx('ค่าคาดหวัง 10%')}
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
                ? [t('หลักสิบ'), t('หลักหน่วย')]
                : [t('หลักร้อย'), t('หลักสิบ'), t('หลักหน่วย')])[i]
            }
            position={
              (two ? ['TENS', 'UNITS'] : ['HUNDREDS', 'TENS', 'UNITS'])[i]
            }
          />
        ))}
      </div>
      <div className="panel-footnote">
        {tx('นับจากเลข')}
        {two ? '2' : '3'}
        {tx('ตัว')}
        {total.toLocaleString('th-TH')}
        {tx('ชุด · สัดส่วนที่พบจริงในช่วงที่เลือก')}
      </div>
    </Panel>
  );
}
export function Patterns({ stats }: { stats: ThreeStats }) {
  const rows = [
    {
      key: 'unique' as const,
      name: t('เลขไม่ซ้ำ'),
      example: 'ABC',
      expected: 72,
    },
    {
      key: 'double' as const,
      name: t('เลขเบิ้ล / เลขหาม'),
      example: 'AAB',
      expected: 27,
    },
    { key: 'triple' as const, name: t('เลขตอง'), example: 'AAA', expected: 1 },
  ];
  return (
    <Panel
      title={t('โครงสร้างของเลข')}
      eyebrow="PATTERN BREAKDOWN"
      aside={<span className="mini-tag">{tx('เทียบค่าทฤษฎี')}</span>}
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
                    {tx('ค่าปกติ')}
                    {row.expected}% · {stats.patterns[row.key]}
                    {tx('ชุด')}
                  </span>
                  <span className={notable ? 'notable' : ''}>
                    {notable ? t('ต่างจากทฤษฎี ≥10 จุด') : t('ปกติ')}
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
            {tx('ต่ำ')}
            <small>000–499</small>
          </span>
          <b className="mono">{percent(stats.low, stats.total).toFixed(1)}%</b>
          <small>
            {tx('สูง')}
            {percent(stats.total - stats.low, stats.total).toFixed(1)}%
          </small>
        </div>
        <div>
          <span>
            {tx('แต้มคู่')}
            <small>{tx('ผลรวมเลขโดด')}</small>
          </span>
          <b className="mono">{percent(stats.even, stats.total).toFixed(1)}%</b>
          <small>
            {tx('แต้มคี่')}
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
      title={t('ผลรวมแต้ม 3 หลัก')}
      eyebrow="DIGIT SUM DISTRIBUTION"
      aside={<span className="mini-tag">{tx('0–27 แต้ม')}</span>}
    >
      <div className="sum-summary">
        <strong className="mono">{stats.total ? peak : '—'}</strong>
        <div>
          <span>{tx('แต้มที่พบมากที่สุด')}</span>
          <small>
            {stats.total
              ? t('{0} ชุด · {1}% ของข้อมูล', [
                  max,
                  percent(max, stats.total).toFixed(1),
                ])
              : t('ยังไม่มีข้อมูลในช่วงนี้')}
          </small>
        </div>
        <span className="sum-symbol" aria-hidden="true">
          Σ
        </span>
      </div>
      <div
        className="sum-chart"
        role="img"
        aria-label={t('ความถี่ผลรวมแต้ม: {0}', [
          stats.sums
            .map((count, sum) => t('{0} แต้ม {1} ครั้ง', [sum, count]))
            .join(', '),
        ])}
      >
        {stats.sums.map((count, sum) => (
          <div key={sum} className="sum-column">
            <div
              className={`sum-bar ${count === max ? 'sum-peak' : ''}`}
              style={{ height: `${(count / max) * 100}%` }}
              title={t('{0} แต้ม: {1} ชุด ({2}%) · ทฤษฎี {3}%', [
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
        <span>{tx('แต้มต่ำ')}</span>
        <span>{tx('ผลรวมหลักร้อย + สิบ + หน่วย')}</span>
        <span>{tx('แต้มสูง')}</span>
      </div>
      <p className="subtle-note">
        {tx(
          'แต้มกลางมีจำนวนชุดเลขเป็นไปได้มากกว่าแต้มปลาย จึงพบได้บ่อยตามธรรมชาติ',
        )}
      </p>
    </Panel>
  );
}

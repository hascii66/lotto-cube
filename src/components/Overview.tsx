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
      <section className="draw-ticket" aria-label={t('งวดล่าสุดในฐานข้อมูล')}>
        <div className="ticket-main">
          <div className="ticket-heading">
            <span>
              <i />
              {tx('งวดล่าสุดในฐานข้อมูล')}
            </span>
            <time dateTime={draw.date}>{formatDate(draw.date)}</time>
          </div>
          <div className="ticket-prize">
            <div>
              <span className="ticket-label">{tx('รางวัลที่ 1')}</span>
              <div className="prize-digits mono">
                {[...draw.prize1].map((digit, i) => (
                  <span key={i}>{digit}</span>
                ))}
              </div>
            </div>
            <div className="ticket-last">
              <span className="ticket-label">{tx('เลขท้าย 2 ตัว')}</span>
              <strong className="mono">{draw.last2}</strong>
            </div>
          </div>
          <div className="ticket-bottom">
            <span>GOVERNMENT LOTTERY / THAILAND</span>
            <button
              onClick={onHistory}
              aria-label={t('ดูผลสลากย้อนหลังทั้งหมด')}
            >
              <ArrowUpRight size={19} />
            </button>
          </div>
        </div>
        <div className="ticket-stub">
          <div>
            <span>{tx('เลขหน้า 3 ตัว')}</span>
            <strong className="mono">{draw.front3.join(' · ')}</strong>
          </div>
          <div>
            <span>{tx('เลขท้าย 3 ตัว')}</span>
            <strong className="mono">{draw.back3.join(' · ')}</strong>
          </div>
          <div className="stub-lines" aria-hidden="true" />
        </div>
      </section>
      <section className="context-card">
        <span className="eyebrow">{tx('รู้ที่มาของตัวเลข')}</span>
        <h2>
          {tx('อ่านอดีต')}
          <br />
          {tx('ให้เห็นภาพชัดขึ้น')}
          <span>.</span>
        </h2>
        <p>
          {tx('เริ่มจากข้อมูล')}
          {formatNumber(total)}
          {tx('งวดในคลัง')}
          <br />
          {tx('สำรวจรูปแบบด้วยสถิติที่ตรวจสอบได้')}
        </p>
        <span className="automatic-label">
          <ShieldCheck size={15} />
          {tx('อัปเดตงวดใหม่อัตโนมัติ')}
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
      label: t('งวดที่นำมาวิเคราะห์'),
      value: formatNumber(draws.length),
      unit: t('งวด'),
      note: draws.length
        ? `${formatDate(draws[draws.length - 1].date, true)} – ${formatDate(draws[0].date, true)}`
        : t('ไม่มีงวดในช่วงที่เลือก'),
      icon: Database,
    },
    {
      label: t('เลข 3 ตัวในชุดข้อมูล'),
      value: formatNumber(stats.total),
      unit: t('ชุด'),
      note: t('นับตามประเภทรางวัลที่เลือก'),
      icon: Layers3,
    },
    {
      label: t('เลข 3 ตัวที่ไม่ซ้ำกัน'),
      value: formatNumber(unique),
      unit: t('เลข'),
      note: t('จากเลขที่เป็นไปได้ 1,000 ชุด'),
      icon: ChartNoAxesCombined,
    },
    {
      label: t('แต้มรวมที่พบบ่อยที่สุด'),
      value: stats.total
        ? String(stats.sums.indexOf(sumMax)).padStart(2, '0')
        : '—',
      unit: t('แต้ม'),
      note: stats.total
        ? t('พบ {0} ครั้งในช่วงที่เลือก', [sumMax])
        : t('ไม่มีข้อมูลสำหรับคำนวณ'),
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
        title={t('10 เลขที่สอดคล้องกับสถิติ')}
        eyebrow="STATISTICAL SHORTLIST"
        aside={<span className="mini-tag">{tx('ดัชนีย้อนหลัง / 100')}</span>}
      >
        <p className="section-description">
          {tx(
            'จัดอันดับจากความถี่รายหลัก แต้มรวม และโครงสร้างเลขในช่วงที่เลือก · คลิกเพื่อตรวจรายละเอียด',
          )}
        </p>
        <div className="picks-grid">
          {picks.map((pick, i) => (
            <button
              className="pick"
              key={pick.number}
              onClick={() => onScore(pick.number)}
              aria-label={t('ตรวจเลข {0} คะแนนจัดอันดับ {1}', [
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
                <small>{tx('คะแนน')}</small>
              </span>
            </button>
          ))}
        </div>
        <Formula picks />
        <div className="shortlist-note">
          <span>
            {tx('คะแนนสูงสะท้อนความถี่ในอดีต ไม่ใช่โอกาสถูกรางวัลครั้งถัดไป')}
          </span>
          <TextLink onClick={() => onScore('')}>{tx('ตรวจเลขของคุณ')}</TextLink>
        </div>
      </Panel>
    </>
  );
}

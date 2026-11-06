import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Check,
  Info,
} from 'lucide-react';
import { findOccurrences, picksForDraw } from '../lib/analytics';
import { formatDate, formatNumber } from '../lib/format';
import { t } from '../lib/i18n';
import type { Draw } from '../lib/types';
import type { View } from '../lib/types';
import { Empty, Formula, Modal, Panel } from './ui';

export function TopDrawPicks({
  draws,
  targetDate,
  onTargetChange,
  digits,
  onDigitsChange,
  onNavigate,
}: {
  draws: Draw[];
  targetDate: string;
  onTargetChange: (date: string) => void;
  digits: '2' | '3' | '6';
  onDigitsChange: (digits: '2' | '3' | '6') => void;
  onNavigate: (view: View) => void;
}) {
  const { target, history, groups } = useMemo(
    () => picksForDraw(draws, targetDate),
    [draws, targetDate],
  );
  const past = targetDate !== 'next';
  const dates = useMemo(
    () =>
      draws
        .map((draw) => draw.date)
        .sort()
        .reverse(),
    [draws],
  );
  const cutoff = history.reduce(
    (latest, draw) => (draw.date > latest ? draw.date : latest),
    '',
  );
  const leadingPick = groups.find((group) => String(group.digits) === digits)
    ?.picks[0]?.number;
  const label = (digits: 2 | 3 | 6) =>
    digits === 2
      ? t('เลขท้าย 2 ตัว')
      : digits === 3
        ? t('เลขท้าย 3 ตัว')
        : t('รางวัลที่ 1 · 6 ตัวตรง');
  const [selected, setSelected] = useState<{
    number: string;
    digits: 2 | 3 | 6;
  } | null>(null);
  useEffect(() => setSelected(null), [targetDate, digits]);
  const hits = selected
    ? findOccurrences(
        history,
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
            <h2 id="top-last-title">
              {past ? t('10 เลขคัดย้อนหลัง') : t('10 เลขคัดสำหรับงวดถัดไป')}
            </h2>
          </div>
        </div>
        <label className="pick-draw-control" htmlFor="pick-draw">
          <span className="pick-draw-label">{t('เลือกงวดสำหรับดูเลขคัด')}</span>
          <span className="pick-draw-select-wrap">
            <CalendarDays size={20} aria-hidden="true" />
            <select
              id="pick-draw"
              value={targetDate}
              onChange={(event) => onTargetChange(event.target.value)}
            >
              <option value="next">
                {draws[0]
                  ? t('ถัดไป · {0} งวด · {1}', [
                      formatNumber(draws.length),
                      formatDate(draws[0].date, true),
                    ])
                  : t('งวดถัดไป · ใช้ข้อมูลล่าสุด')}
              </option>
              {past && !target && (
                <option value={targetDate} disabled>
                  {t('ไม่พบงวด {0}', [targetDate])}
                </option>
              )}
              {dates.map((date) => (
                <option key={date} value={date}>
                  {formatDate(date, true)}
                </option>
              ))}
            </select>
          </span>
        </label>
        <p aria-live="polite">
          {past
            ? t('ใช้ข้อมูลก่อนงวดที่เลือก {0} งวด · ข้อมูลถึง {1}', [
                formatNumber(history.length),
                cutoff ? formatDate(cutoff, true) : '—',
              ])
            : t('จากฐานข้อมูลทั้งหมด {0} งวด · จัดอันดับตามคะแนนย้อนหลัง', [
                formatNumber(draws.length),
              ])}
        </p>
      </div>
      <div
        className="segmented pick-awards"
        role="group"
        aria-label={t('เลือกประเภทเลขคัด')}
      >
        {(['2', '3', '6'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={digits === value}
            className={digits === value ? 'selected' : ''}
            onClick={() => onDigitsChange(value)}
          >
            {value === '2'
              ? t('ท้าย 2 ตัว')
              : value === '3'
                ? t('ท้าย 3 ตัว')
                : t('6 ตัวตรง')}
          </button>
        ))}
      </div>
      <p className="pick-score-note">
        <Info size={22} aria-hidden="true" />
        {digits === '2' && leadingPick
          ? t('เลข {0} เด่นจากความถี่แยกหลัก ไม่ใช่สถิติเลขคู่ · ไม่ถ่วงวัน', [
              leadingPick,
            ])
          : past
            ? t('{0} งวดก่อนวันเลือก · คะแนนไม่ใช่โอกาสถูกรางวัล', [
                formatNumber(history.length),
              ])
            : t('ความถี่แยกหลัก · คะแนนไม่ใช่โอกาสถูกรางวัล')}
      </p>
      <nav className="wayfinding" aria-label={t('ทางลัดไปยังส่วนต่าง ๆ')}>
        {(
          [
            { view: 'overview', label: t('เลขคัด'), detail: t('เริ่มต้น') },
            { view: 'three', label: t('3 ตัว'), detail: '' },
            { view: 'two', label: t('2 ตัว'), detail: '' },
            { view: 'scorer', label: t('เช็กเลข'), detail: '' },
            { view: 'history', label: t('ย้อนหลัง'), detail: t('ปลายทาง') },
          ] as const
        ).map(({ view, label, detail }, index) => (
          <a
            key={view}
            href={`?view=${view}`}
            className={`wayfinding-stop wayfinding-stop-${index + 1}${view === 'overview' ? ' wayfinding-start' : ''}`}
            aria-current={view === 'overview' ? 'page' : undefined}
            onClick={(event) => {
              event.preventDefault();
              onNavigate(view);
            }}
          >
            <span className="wayfinding-dot" aria-hidden="true" />
            <span className="wayfinding-label">{label}</span>
            {detail && <span className="wayfinding-detail">{detail}</span>}
          </a>
        ))}
      </nav>
      {past && (
        <p className="pick-backtest-note">
          {t(
            'คำนวณย้อนหลังด้วยสูตรปัจจุบันและข้อมูลในคลัง ใช้เฉพาะงวดก่อนวันที่เลือก ไม่ใช่บันทึกเลขคัดที่เผยแพร่ไว้ในวันนั้น',
          )}
        </p>
      )}
      {past && !target ? (
        <Empty>{t('ไม่พบงวดที่เลือกในคลัง กรุณาเลือกงวดอื่น')}</Empty>
      ) : (
        <div className="top-last-panels">
          {groups
            .filter((group) => String(group.digits) === digits)
            .map(({ digits, picks, actual, matched }) => {
              return (
                <Panel
                  key={digits}
                  className={`top-last-card${digits === 6 ? ' top-last-six' : ''}`}
                  title={label(digits)}
                  aside={
                    <span className="mini-tag">{t('ดัชนีย้อนหลัง / 100')}</span>
                  }
                >
                  {target && (
                    <div className="pick-comparison">
                      <span>
                        {t('ผลจริง')}{' '}
                        <strong className="mono">{actual.join(' · ')}</strong>
                      </span>
                      <span>
                        {history.length
                          ? t('ตรง Top 10 จำนวน {0}/{1} ชุด', [
                              matched.length,
                              actual.length,
                            ])
                          : t('ไม่มีข้อมูลก่อนงวดนี้สำหรับประเมิน')}
                      </span>
                    </div>
                  )}
                  {picks.length ? (
                    <ol
                      className="top-last-grid"
                      aria-label={t('10 เลขคัด · {0}', [label(digits)])}
                    >
                      {picks.map(({ number, score }, index) => (
                        <li key={number}>
                          <button
                            className={`top-last-number ${index === 0 ? 'top-last-leader' : ''}${matched.includes(number) ? ' top-last-match' : ''}`}
                            onClick={() => setSelected({ number, digits })}
                            aria-label={
                              t('อันดับ {0} {1} เลข {2} คะแนน {3} ดูประวัติ', [
                                index + 1,
                                label(digits),
                                number,
                                formatNumber(Math.round(score * 10) / 10),
                              ]) +
                              (matched.includes(number)
                                ? ` · ${t('ตรงผลจริง')}`
                                : '')
                            }
                          >
                            <span className="top-last-rank">
                              <span className="mono">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                              {matched.includes(number) ? (
                                <Check
                                  size={12}
                                  className="pick-match-icon"
                                  aria-label={t('ตรงผลจริง')}
                                />
                              ) : (
                                <ArrowUpRight size={12} aria-hidden="true" />
                              )}
                            </span>
                            <strong className="mono">{number}</strong>
                            <span className="top-last-score-wrap">
                              <span className="top-last-count-label">
                                {t('คะแนน')}
                              </span>
                              <span className="top-last-count">
                                {formatNumber(Math.round(score * 10) / 10)}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <Empty>
                      {past
                        ? t(
                            'ไม่มีข้อมูลก่อนงวดนี้สำหรับคัดเลข ลองเลือกงวดที่ใหม่กว่า',
                          )
                        : t(
                            'ยังไม่มีข้อมูลสำหรับคัดเลข เพิ่มหรือนำเข้าผลสลากในฐานข้อมูล',
                          )}
                    </Empty>
                  )}
                </Panel>
              );
            })}
        </div>
      )}
      <Formula nextDraw />
      <p className="top-last-footnote">
        {t(
          'คะแนนไม่ใช่เปอร์เซ็นต์โอกาสถูกรางวัลและไม่รับประกันผล · แตะเลขเพื่อดูประวัติรางวัลประเภทนั้น',
        )}
      </p>
      {selected && (
        <Modal
          title={t('ประวัติ {0} · {1}', [
            label(selected.digits),
            selected.number,
          ])}
          description={t(
            'พบ {0} ครั้งจากข้อมูลที่ใช้คำนวณ {1} งวด · นับเฉพาะรางวัลประเภทนี้',
            [hits.length, formatNumber(history.length)],
          )}
          onClose={() => setSelected(null)}
        >
          {hits.length ? (
            <ul className="hit-list">
              {hits.map((hit, index) => (
                <li key={`${hit.date}-${index}`}>
                  <b className="mono">{hit.number}</b>
                  <span>{hit.label}</span>
                  <time dateTime={hit.date}>{formatDate(hit.date, true)}</time>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>
              {t(
                'ยังไม่เคยพบเลขนี้ในรางวัลประเภทนี้ · คะแนนคำนวณจากความถี่รายหลัก',
              )}
            </Empty>
          )}
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

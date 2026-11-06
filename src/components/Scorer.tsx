import { t, tx } from '../lib/i18n';
import { useState, type FormEvent } from 'react';
import { ArrowRight, CornerDownRight, SearchCheck } from 'lucide-react';
import {
  analyzeThree,
  analyzeTwo,
  findOccurrences,
  permutations,
  scoreThree,
  scoreTwo,
} from '../lib/analytics';
import type { Draw, PrizeType } from '../lib/types';
import { formatDate } from '../lib/format';
import { Empty, Formula, Panel } from './ui';
export function Scorer({
  draws,
  allDraws,
  prize,
  initial = '',
  initialMode = '3',
}: {
  draws: Draw[];
  allDraws: Draw[];
  prize: PrizeType;
  initial?: string;
  initialMode?: '2' | '3';
}) {
  const [mode, setMode] = useState<'2' | '3'>(initialMode);
  const [inputs, setInputs] = useState([initial, '', '']);
  const [results, setResults] = useState<string[]>(initial ? [initial] : []);
  const [invalid, setInvalid] = useState(false);
  const error = invalid
    ? t('กรอกเลข {0} หลักอย่างน้อย 1 ชุด และไม่เกิน 3 ชุด เช่น {1}', [
        mode,
        mode === '3' ? '079' : '09',
      ])
    : '';
  const stats = analyzeThree(draws, prize);
  const statsTwo = analyzeTwo(draws);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = inputs.map((s) => s.trim()).filter(Boolean);
    if (
      !values.length ||
      values.some((n) => !(mode === '3' ? /^\d{3}$/ : /^\d{2}$/).test(n))
    ) {
      setInvalid(true);
      const index = Math.max(
        0,
        inputs.findIndex((v) => v.length !== Number(mode)),
      );
      document.getElementById(`scorer-${index}`)?.focus();
      return;
    }
    setInvalid(false);
    setResults([...new Set(values)]);
  }
  function switchMode(next: '2' | '3') {
    setMode(next);
    setInputs(['', '', '']);
    setResults([]);
    setInvalid(false);
  }
  return (
    <>
      <Panel
        title={t('ลองตรวจเลขที่คุณสนใจ')}
        eyebrow="NUMBER EXPLORER"
        aside={<SearchCheck size={23} className="text-accent" />}
      >
        <p className="section-description">
          {tx(
            'เทียบกับสถิติในช่วงที่เลือก พร้อมค้นหาเลขตรงและเลขกลับจากฐานข้อมูลทั้งหมด',
          )}
        </p>
        <div className="segmented" aria-label={t('จำนวนหลัก')}>
          {(['3', '2'] as const).map((value) => (
            <button
              key={value}
              aria-pressed={mode === value}
              className={mode === value ? 'selected' : ''}
              onClick={() => switchMode(value)}
            >
              {tx('เลข')}
              {value}
              {tx('ตัว')}
            </button>
          ))}
        </div>
        <form noValidate onSubmit={submit} className="scorer-form">
          <div className="scorer-inputs">
            {inputs.map((value, index) => (
              <div key={index}>
                <label htmlFor={`scorer-${index}`}>
                  {tx('ชุดที่')}
                  {index + 1}
                  {index > 0 && <small>{tx('(ไม่บังคับ)')}</small>}
                </label>
                <input
                  className="number-input mono"
                  id={`scorer-${index}`}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={Number(mode)}
                  placeholder={mode === '3' ? '000' : '00'}
                  value={value}
                  onChange={(e) =>
                    setInputs(
                      inputs.map((v, i) =>
                        i === index ? e.target.value.replace(/[^0-9]/g, '') : v,
                      ),
                    )
                  }
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'scorer-error' : undefined}
                />
              </div>
            ))}
          </div>
          <button
            type="submit"
            className="button button-primary"
            disabled={!draws.length}
          >
            {tx('เช็คสถิติ & คะแนน')}
            <ArrowRight size={17} />
          </button>
        </form>
        <div className="form-error-slot">
          <p id="scorer-error" className="error-text" role="alert">
            {error}
          </p>
        </div>
        <Formula />
        {!draws.length && <Empty />}
      </Panel>
      {results.map((number) => {
        const { score, components } =
          mode === '3' ? scoreThree(number, stats) : scoreTwo(number, statsTwo);
        const variants = permutations(number);
        const hits = findOccurrences(allDraws, variants);
        const exact = hits.filter((h) => h.number === number);
        return (
          <Panel key={`${mode}-${number}`} className="score-result">
            <div className="score-result-heading">
              <div>
                <span className="eyebrow">
                  {tx('ผลวิเคราะห์เลข')}
                  {mode}
                  {tx('ตัว')}
                </span>
                <h2 className="result-number mono">{number}</h2>
              </div>
              <div className="score-total">
                <strong className="mono">{score.toFixed(1)}</strong>
                <span>{tx('/ 100 คะแนน')}</span>
              </div>
            </div>
            <div className="score-components">
              {components.map((component, i) => (
                <div key={i}>
                  <span>
                    {
                      (mode === '3'
                        ? [
                            t('หลักร้อย'),
                            t('หลักสิบ'),
                            t('หลักหน่วย'),
                            t('ผลรวมแต้ม'),
                          ]
                        : [t('หลักสิบ'), t('หลักหน่วย')])[i]
                    }
                  </span>
                  <b className="mono">
                    {component.toFixed(1)}
                    <small> / {mode === '3' ? 25 : 50}</small>
                  </b>
                </div>
              ))}
            </div>
            <div className="permutations-heading">
              <h3>
                <CornerDownRight size={18} />
                {tx('เลขกลับ')}
                {variants.length} {tx('ชุดที่ไม่ซ้ำ')}
              </h3>
              <span>
                {tx('เลขตรงเคยพบ')}
                {exact.length}
                {tx('ครั้ง')}
              </span>
            </div>
            <div className="permutation-grid">
              {variants.map((v) => {
                const count = hits.filter((h) => h.number === v).length;
                return (
                  <div className={v === number ? 'exact' : ''} key={v}>
                    <b className="mono">{v}</b>
                    <span>
                      {count
                        ? t('พบ {0} ครั้ง', [count])
                        : t('ไม่พบในฐานข้อมูล')}
                    </span>
                  </div>
                );
              })}
            </div>
            {hits.length ? (
              <details className="hit-details" open>
                <summary>
                  {tx('ประวัติเลขตรงและเลขกลับ ·')}
                  {hits.length}
                  {tx('รายการจาก')} {allDraws.length}
                  {tx('งวด (ทุกรางวัล)')}
                </summary>
                <ul className="hit-list">
                  {hits.map((hit, i) => (
                    <li key={`${hit.date}-${i}`}>
                      <b
                        className={`mono ${hit.number === number ? 'text-accent' : ''}`}
                      >
                        {hit.number}
                      </b>
                      <span>{hit.label}</span>
                      <time dateTime={hit.date}>
                        {formatDate(hit.date, true)}
                      </time>
                    </li>
                  ))}
                </ul>
              </details>
            ) : (
              <Empty>
                {tx('ไม่พบเลขตรงหรือเลขกลับชุดนี้ในฐานข้อมูล')}
                {allDraws.length}
                {tx('งวด การไม่เคยออกไม่ได้เพิ่มโอกาสในงวดถัดไป')}
              </Empty>
            )}
            <p className="subtle-note">
              {tx('คะแนนใช้ข้อมูล')}
              {draws.length}
              {tx(
                'งวดตามตัวกรอง · ประวัติค้นจากฐานข้อมูลทั้งหมดโดยไม่จำกัดประเภทรางวัล',
              )}
            </p>
          </Panel>
        );
      })}
    </>
  );
}

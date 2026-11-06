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
    ? t('enter_one_to_three_digit_numbers', [
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
        title={t('explore_a_number_you_have_in')}
        eyebrow="NUMBER EXPLORER"
        aside={<SearchCheck size={23} className="text-accent" />}
      >
        <p className="section-description">
          {tx(
            'compare_against_your_selected_period_and',
          )}
        </p>
        <div className="segmented" aria-label={t('number_of_digits')}>
          {(['3', '2'] as const).map((value) => (
            <button
              key={value}
              aria-pressed={mode === value}
              className={mode === value ? 'selected' : ''}
              onClick={() => switchMode(value)}
            >
              {value === '3' ? t('three_digits') : t('two_digits')}
            </button>
          ))}
        </div>
        <form noValidate onSubmit={submit} className="scorer-form">
          <div className="scorer-inputs">
            {inputs.map((value, index) => (
              <div key={index}>
                <label htmlFor={`scorer-${index}`}>
                  {tx('number')}
                  {index + 1}
                  {index > 0 && <small>{tx('optional')}</small>}
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
            {tx('check_statistics_score')}
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
                  {tx('analysis_for')}
                  {mode}
                  {tx('digits')}
                </span>
                <h2 className="result-number mono">{number}</h2>
              </div>
              <div className="score-total">
                <strong className="mono">{score.toFixed(1)}</strong>
                <span>{tx('100_points')}</span>
              </div>
            </div>
            <div className="score-components">
              {components.map((component, i) => (
                <div key={i}>
                  <span>
                    {
                      (mode === '3'
                        ? [
                            t('hundreds'),
                            t('tens'),
                            t('units'),
                            t('digit_sum_2'),
                          ]
                        : [t('tens'), t('units')])[i]
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
                {tx('permutations')}
                {variants.length} {tx('unique_arrangements')}
              </h3>
              <span>
                {tx('exact_matches')}
                {exact.length}
                {tx('times')}
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
                        ? t('found_times', [count])
                        : t('not_found')}
                    </span>
                  </div>
                );
              })}
            </div>
            {hits.length ? (
              <details className="hit-details" open>
                <summary>
                  {tx('exact_matches_and_permutations')}
                  {hits.length}
                  {tx('results_from_2')} {allDraws.length}
                  {tx('draws_all_awards')}
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
                {tx('no_exact_matches_or_permutations_found')}
                {allDraws.length}
                {tx('draws_absence_does_not_increase_a')}
              </Empty>
            )}
            <p className="subtle-note">
              {tx('score_based_on')}
              {draws.length}
              {tx(
                'filtered_draws_history_covers_the_entire',
              )}
            </p>
          </Panel>
        );
      })}
    </>
  );
}

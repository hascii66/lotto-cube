import { t, tx } from '../lib/i18n';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { ArrowUpRight, X, Info, Search } from 'lucide-react';
export function Panel({
  title,
  eyebrow,
  aside,
  children,
  className = '',
}: {
  title?: string;
  eyebrow?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-heading">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
export function Empty({
  children = t('no_results_in_this_period_try'),
}: {
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Info size={22} />
      <p>{children}</p>
    </div>
  );
}
export function Modal({
  title,
  description,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) closeRef.current();
      }}
    >
      <div className="modal-heading">
        <div>
          <span className="eyebrow">LOTTOCUBE / DATA WORKSPACE</span>
          <h2 id={titleId}>{title}</h2>
        </div>
        <button
          className="icon-button"
          aria-label={t('close_dialog')}
          disabled={busy}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {description && (
        <p className="modal-description" id={descriptionId}>
          {description}
        </p>
      )}
      {children}
    </dialog>
  );
}
export function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="search-field">
      <Search size={17} />
      <label className="sr-only" htmlFor="history-search">
        {tx('search_the_draw_archive')}
      </label>
      <input
        ref={ref}
        id="history-search"
        placeholder={t('search_2_or_3_digits')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          className="icon-button"
          aria-label={t('clear_search')}
          onClick={() => {
            onChange('');
            ref.current?.focus();
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
export function TextLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <ArrowUpRight size={16} />
    </button>
  );
}
export function Formula({
  picks = false,
  nextDraw = false,
}: {
  picks?: boolean;
  nextDraw?: boolean;
}) {
  return (
    <details className="formula">
      <summary>
        {tx('see_the_calculation')}
        <Info size={14} />
      </summary>
      <div>
        {nextDraw ? (
          <>
            <p>
              {tx(
                'next_draw_picks_use_all_stored',
              )}
            </p>
            <p>
              {tx(
                'each_position_scores_its_digit_s',
              )}
            </p>
            <p>
              {tx(
                'a_top_2_digit_pair_can',
              )}
            </p>
            <p>
              {tx(
                'weekday_does_not_affect_the_picks',
              )}
            </p>
            <p>
              {tx(
                'the_10_highest_scoring_combinations_are',
              )}
            </p>
          </>
        ) : (
          <>
            <p>
              {tx(
                'three_digit_score_hundreds_tens_units',
              )}
            </p>
            {picks && (
              <p>
                {tx(
                  'ranking_score_three_digit_score_0',
                )}
              </p>
            )}
            <p>
              {tx(
                'two_digit_scores_use_tens_and',
              )}
            </p>
          </>
        )}
      </div>
    </details>
  );
}

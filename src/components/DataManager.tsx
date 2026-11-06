import { t, tx } from '../lib/i18n';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, FileJson, Upload } from 'lucide-react';
import { mergeDraws, parseDraws, sameResult, validateDraw } from '../lib/data';
import { formatDate, today } from '../lib/format';
import type { Draw } from '../lib/types';
import { Modal } from './ui';
export type DataAction = 'add' | 'import';
interface Props {
  action: DataAction;
  draws: Draw[];
  save: (draws: Draw[], replace?: boolean) => Draw[];
  onClose: () => void;
  onSuccess: (message: string, history?: boolean) => void;
}
const getFields = () => [
  { key: 'date', label: t('draw_date'), size: 0, placeholder: '' },
  { key: 'prize1', label: t('first_prize'), size: 6, placeholder: '097863' },
  {
    key: 'frontA',
    label: t('front_3_digits_first'),
    size: 3,
    placeholder: '290',
  },
  {
    key: 'frontB',
    label: t('front_3_digits_second'),
    size: 3,
    placeholder: '742',
  },
  {
    key: 'backA',
    label: t('last_3_digits_first'),
    size: 3,
    placeholder: '881',
  },
  {
    key: 'backB',
    label: t('last_3_digits_second'),
    size: 3,
    placeholder: '339',
  },
  { key: 'last2', label: t('last_two_digits'), size: 2, placeholder: '21' },
];
export function DataManager({
  action,
  draws,
  save,
  onClose,
  onSuccess,
}: Props) {
  const fields = getFields();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [incoming, setIncoming] = useState<Draw[]>([]);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [discard, setDiscard] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = action === 'add' && Object.values(values).some(Boolean);
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    if (dirty) window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);
  function close() {
    if (dirty) setDiscard(true);
    else onClose();
  }
  function add(event: FormEvent) {
    event.preventDefault();
    setError('');
    const nextErrors: Record<string, string> = {};
    for (const field of fields) {
      const value = values[field.key] ?? '';
      if (field.size ? !new RegExp(`^\\d{${field.size}}$`).test(value) : !value)
        nextErrors[field.key] = field.size
          ? t('enter_exactly_digits', [field.size])
          : t('choose_a_draw_date');
    }
    if (!Object.keys(nextErrors).length) {
      let draw: Draw | undefined;
      try {
        draw = validateDraw({
          date: values.date,
          prize1: values.prize1,
          front3: [values.frontA, values.frontB],
          back3: [values.backA, values.backB],
          last2: values.last2,
          source: 'manual',
        });
      } catch (err) {
        nextErrors.date = (err as Error).message;
      }
      if (draw) {
        if (draws.some((d) => d.date === draw.date))
          nextErrors.date = t(
            'this_draw_already_exists_to_edit',
          );
        else {
          try {
            save([draw]);
            onSuccess(
              t('draw_added', [formatDate(draw.date, true)]),
              true,
            );
            return;
          } catch (err) {
            setError((err as Error).message);
          }
        }
      }
    }
    setErrors(nextErrors);
    const first = Object.keys(nextErrors)[0];
    if (first) document.getElementById(`add-${first}`)?.focus();
  }
  async function importFile(file?: File) {
    setError('');
    setIncoming([]);
    setFileName(file?.name ?? '');
    if (!file) return;
    if (
      !file.name.toLowerCase().endsWith('.json') ||
      !file.size ||
      file.size > 5 * 1024 * 1024
    ) {
      setError(t('choose_a_non_empty_json_file'));
      return;
    }
    setBusy(true);
    try {
      setIncoming(parseDraws(JSON.parse(await file.text())));
    } catch (err) {
      setError(
        err instanceof SyntaxError
          ? t(
              'invalid_json_check_the_syntax_and',
            )
          : (err as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  const additions = incoming.filter(
    (d) => !draws.some((old) => old.date === d.date),
  );
  const changes = incoming.filter((d) =>
    draws.some((old) => old.date === d.date && !sameResult(old, d)),
  );
  function commitImport() {
    try {
      save(
        incoming.map((d) => ({ ...d, source: 'import' })),
        true,
      );
      onSuccess(
        t('json_imported_added_updated', [
          additions.length,
          changes.length,
        ]),
        true,
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }
  const titles = {
    add: t('add_a_draw'),
    import: t('import_json_data'),
  };
  return (
    <Modal
      title={discard ? t('you_have_unsaved_changes') : titles[action]}
      description={
        discard
          ? t('closing_this_window_will_discard_your')
          : action === 'add'
            ? t('complete_every_award_field_leading_zeros')
            : t('review_data_before_saving_json_files')
      }
      onClose={close}
      busy={busy}
    >
      {discard ? (
        <div className="modal-actions">
          <button className="button" onClick={() => setDiscard(false)}>
            {tx('continue_editing')}
          </button>
          <button className="button button-danger" onClick={onClose}>
            {tx('discard_and_close')}
          </button>
        </div>
      ) : (
        <>
          {action === 'add' && (
            <form noValidate onSubmit={add}>
              <div className="entry-grid">
                {fields.map((field) => (
                  <div
                    className={`field ${field.key === 'date' || field.key === 'prize1' || field.key === 'last2' ? 'field-full' : ''}`}
                    key={field.key}
                  >
                    <label htmlFor={`add-${field.key}`}>{field.label}</label>
                    <input
                      id={`add-${field.key}`}
                      type={field.key === 'date' ? 'date' : 'text'}
                      inputMode={field.size ? 'numeric' : undefined}
                      max={field.key === 'date' ? today() : undefined}
                      min={field.key === 'date' ? '1900-01-01' : undefined}
                      maxLength={field.size || undefined}
                      value={values[field.key] ?? ''}
                      onChange={(e) => {
                        setValues({
                          ...values,
                          [field.key]: field.size
                            ? e.target.value.replace(/[^0-9]/g, '')
                            : e.target.value,
                        });
                        setErrors({ ...errors, [field.key]: '' });
                      }}
                      placeholder={field.placeholder}
                      autoComplete="off"
                      className={field.size ? 'mono' : ''}
                      aria-invalid={!!errors[field.key]}
                      aria-describedby={`error-${field.key}`}
                    />
                    <span className="field-error" id={`error-${field.key}`}>
                      {errors[field.key] ?? ''}
                    </span>
                  </div>
                ))}
              </div>
              <p className="error-text" role="alert">
                {error}
              </p>
              <div className="modal-actions">
                <button type="button" className="button" onClick={close}>
                  {tx('cancel')}
                </button>
                <button className="button button-primary" type="submit">
                  {tx('save_draw')}
                </button>
              </div>
            </form>
          )}
          {action === 'import' && (
            <>
              <div className="upload-box">
                <FileJson size={32} />
                <strong>{tx('choose_a_results_backup')}</strong>
                <p>{tx('use_the_same_format_as_an')}</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,application/json"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => {
                    void importFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={16} />
                  {busy ? t('reading_file') : t('choose_json_file')}
                </button>
                {fileName && <span className="file-name">{fileName}</span>}
              </div>
              {incoming.length > 0 && (
                <div className="import-preview">
                  <h3>
                    <Check size={18} />
                    {tx('validated')}
                    {incoming.length}
                    {tx('draws')}
                  </h3>
                  <p>
                    {tx('new')}
                    <b>{additions.length}</b>
                    {tx('draws_changed_results')} <b>{changes.length}</b>
                    {tx('draws_unchanged')}{' '}
                    {incoming.length - additions.length - changes.length}
                    {tx('draws')}
                  </p>
                  <p>
                    {tx('after_saving')}
                    {mergeDraws(draws, incoming, true).length}{' '}
                    {tx('draws_other_dates_remain_unchanged')}
                  </p>
                  {changes.length > 0 && (
                    <div className="warning-box">
                      {tx('these_draws_will_be_replaced')}{' '}
                      {changes
                        .slice(0, 5)
                        .map((d) => formatDate(d.date, true))
                        .join(', ')}
                      {changes.length > 5 &&
                        t('and_more_draws', [changes.length - 5])}{' '}
                      {tx('export_the_current_data_first_if')}
                    </div>
                  )}
                </div>
              )}
              <p className="error-text" role="alert">
                {error}
              </p>
              <div className="modal-actions">
                <button className="button" disabled={busy} onClick={onClose}>
                  {tx('cancel')}
                </button>
                <button
                  className="button button-primary"
                  disabled={!incoming.length || busy}
                  onClick={commitImport}
                >
                  {changes.length
                    ? t('import_and_replace_changed_draws')
                    : t('save_imported_data')}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}

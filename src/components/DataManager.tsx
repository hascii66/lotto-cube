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
  { key: 'date', label: t('วันที่ออกรางวัล'), size: 0, placeholder: '' },
  { key: 'prize1', label: t('รางวัลที่ 1'), size: 6, placeholder: '097863' },
  {
    key: 'frontA',
    label: t('เลขหน้า 3 ตัว · ชุดที่ 1'),
    size: 3,
    placeholder: '290',
  },
  {
    key: 'frontB',
    label: t('เลขหน้า 3 ตัว · ชุดที่ 2'),
    size: 3,
    placeholder: '742',
  },
  {
    key: 'backA',
    label: t('เลขท้าย 3 ตัว · ชุดที่ 1'),
    size: 3,
    placeholder: '881',
  },
  {
    key: 'backB',
    label: t('เลขท้าย 3 ตัว · ชุดที่ 2'),
    size: 3,
    placeholder: '339',
  },
  { key: 'last2', label: t('เลขท้าย 2 ตัว'), size: 2, placeholder: '21' },
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
          ? t('กรอกตัวเลขให้ครบ {0} หลัก', [field.size])
          : t('เลือกวันที่ออกรางวัล');
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
            'มีงวดนี้อยู่แล้ว หากต้องการแก้ไข ให้นำเข้า JSON และตรวจสอบก่อนแทนที่',
          );
        else {
          try {
            save([draw]);
            onSuccess(
              t('เพิ่มผลสลากงวด {0} แล้ว', [formatDate(draw.date, true)]),
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
      setError(t('เลือกไฟล์ .json ขนาดไม่เกิน 5 MB และต้องไม่เป็นไฟล์ว่าง'));
      return;
    }
    setBusy(true);
    try {
      setIncoming(parseDraws(JSON.parse(await file.text())));
    } catch (err) {
      setError(
        err instanceof SyntaxError
          ? t(
              'ไฟล์ JSON ไม่ถูกต้อง ตรวจสอบเครื่องหมายและโครงสร้าง array แล้วลองใหม่',
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
        t('นำเข้า JSON แล้ว · เพิ่ม {0} งวด อัปเดต {1} งวด', [
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
    add: t('เพิ่มผลสลากงวดใหม่'),
    import: t('นำเข้าข้อมูล JSON'),
  };
  return (
    <Modal
      title={discard ? t('ยังมีข้อมูลที่ไม่ได้บันทึก') : titles[action]}
      description={
        discard
          ? t('หากปิดหน้าต่าง ข้อมูลที่กำลังกรอกจะไม่ถูกบันทึก')
          : action === 'add'
            ? t('กรอกผลรางวัลครบทุกช่อง เลขศูนย์นำหน้าจะถูกเก็บไว้')
            : t('ตรวจสอบข้อมูลก่อนบันทึก ไฟล์ .json ไม่เกิน 5 MB')
      }
      onClose={close}
      busy={busy}
    >
      {discard ? (
        <div className="modal-actions">
          <button className="button" onClick={() => setDiscard(false)}>
            {tx('กลับไปกรอกต่อ')}
          </button>
          <button className="button button-danger" onClick={onClose}>
            {tx('ปิดโดยไม่บันทึก')}
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
                  {tx('ยกเลิก')}
                </button>
                <button className="button button-primary" type="submit">
                  {tx('บันทึกผลสลาก')}
                </button>
              </div>
            </form>
          )}
          {action === 'import' && (
            <>
              <div className="upload-box">
                <FileJson size={32} />
                <strong>{tx('เลือกไฟล์สำรองผลสลาก')}</strong>
                <p>{tx('ใช้รูปแบบเดียวกับไฟล์ที่ส่งออกจาก LottoCube')}</p>
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
                  {busy ? t('กำลังอ่านไฟล์...') : t('เลือกไฟล์ JSON')}
                </button>
                {fileName && <span className="file-name">{fileName}</span>}
              </div>
              {incoming.length > 0 && (
                <div className="import-preview">
                  <h3>
                    <Check size={18} />
                    {tx('ตรวจรูปแบบผ่าน ·')}
                    {incoming.length}
                    {tx('งวด')}
                  </h3>
                  <p>
                    {tx('เพิ่มใหม่')}
                    <b>{additions.length}</b>
                    {tx('งวด · ผลรางวัลเปลี่ยน')} <b>{changes.length}</b>
                    {tx('งวด · เหมือนเดิม')}{' '}
                    {incoming.length - additions.length - changes.length}
                    {tx('งวด')}
                  </p>
                  <p>
                    {tx('หลังบันทึกจะมี')}
                    {mergeDraws(draws, incoming, true).length}{' '}
                    {tx('งวด ข้อมูลวันที่อื่นยังอยู่ครบ')}
                  </p>
                  {changes.length > 0 && (
                    <div className="warning-box">
                      {tx('ผลเดิมจะถูกแทนที่ในงวด:')}{' '}
                      {changes
                        .slice(0, 5)
                        .map((d) => formatDate(d.date, true))
                        .join(', ')}
                      {changes.length > 5 &&
                        t('และอีก {0} งวด', [changes.length - 5])}{' '}
                      {tx('· ส่งออกข้อมูลเดิมก่อนหากต้องการสำรอง')}
                    </div>
                  )}
                </div>
              )}
              <p className="error-text" role="alert">
                {error}
              </p>
              <div className="modal-actions">
                <button className="button" disabled={busy} onClick={onClose}>
                  {tx('ยกเลิก')}
                </button>
                <button
                  className="button button-primary"
                  disabled={!incoming.length || busy}
                  onClick={commitImport}
                >
                  {changes.length
                    ? t('นำเข้าและแทนที่งวดที่เปลี่ยน')
                    : t('บันทึกข้อมูลที่นำเข้า')}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}

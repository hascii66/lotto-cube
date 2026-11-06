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
  children = t('ยังไม่มีผลสลากในช่วงที่เลือก ลองเลือกวันอื่นหรือเพิ่มจำนวนงวด'),
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
          aria-label={t('ปิดหน้าต่าง')}
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
        {tx('ค้นหาเลขในฐานข้อมูล')}
      </label>
      <input
        ref={ref}
        id="history-search"
        placeholder={t('ค้นหาเลข 2 หรือ 3 ตัว...')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          className="icon-button"
          aria-label={t('ล้างคำค้นหา')}
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
        {tx('สูตรคำนวณที่ตรวจสอบได้')}
        <Info size={14} />
      </summary>
      <div>
        {nextDraw ? (
          <>
            <p>
              {tx(
                'งวดถัดไปใช้ข้อมูลทุกงวดในคลัง ส่วนงวดย้อนหลังใช้เฉพาะข้อมูลก่อนวันที่เลือก ผลของงวดที่เลือกใช้เปรียบเทียบเท่านั้น ไม่นำมาคิดคะแนน',
              )}
            </p>
            <p>
              {tx(
                'คะแนนแต่ละหลัก = จำนวนครั้งที่เลขนั้นปรากฏในหลักนั้น ÷ จำนวนครั้งสูงสุดในหลักเดียวกัน คะแนนรวม = ค่าเฉลี่ยคะแนนทุกหลัก × 100 ใช้เลขท้าย 2 ตัว เลขท้าย 3 ตัว และรางวัลที่ 1 แยกกันจากช่วงข้อมูลที่แสดง',
              )}
            </p>
            <p>
              {tx(
                'เลข 2 ตัวอันดับต้นอาจเกิดจากเลขที่พบบ่อยที่สุดของหลักสิบรวมกับเลขที่พบบ่อยที่สุดของหลักหน่วย คะแนน 100 จึงไม่ได้แปลว่าคู่นั้นออกบ่อยที่สุด',
              )}
            </p>
            <p>
              {tx(
                'วันในสัปดาห์ไม่มีผลกับเลขคัด สูตรจัดอันดับใช้ความถี่แยกหลักจากผลย้อนหลังเท่านั้น',
              )}
            </p>
            <p>
              {tx(
                'คัด 10 เลขที่มีคะแนนรวมสูงสุดจากเลขที่เป็นไปได้ทั้งหมด รวมเลขที่ยังไม่เคยออก หากคะแนนเท่ากันเรียงตามเลข เก็บศูนย์นำหน้าและลำดับหลักเดิม งวดถัดไปหมายถึงงวดหลังข้อมูลล่าสุดในคลัง ไม่ระบุวันออกรางวัลล่วงหน้า',
              )}
            </p>
          </>
        ) : (
          <>
            <p>
              {tx(
                'คะแนนเลข 3 ตัว = คะแนนหลักร้อย + หลักสิบ + หลักหน่วย + ผลรวมแต้ม ส่วนละไม่เกิน 25 คะแนน แต่ละส่วน = ความถี่ที่พบ ÷ ความถี่สูงสุดในส่วนนั้น × 25',
              )}
            </p>
            {picks && (
              <p>
                {tx(
                  'คะแนนจัดอันดับ = คะแนนเลข 3 ตัว × 0.9 + (ความถี่โครงสร้างเลขนั้น ÷ ความถี่โครงสร้างสูงสุด) × 10 คำนวณเลข 000–999 ครบทุกชุด แล้วเรียงคะแนนจากมากไปน้อย หากเท่ากันเรียงตามเลข',
                )}
              </p>
            )}
            <p>
              {tx(
                'เลข 2 ตัวคิดหลักสิบและหลักหน่วย ส่วนละ 50 คะแนน คะแนนเป็นดัชนีความสอดคล้องกับข้อมูลย้อนหลัง ไม่ใช่เปอร์เซ็นต์โอกาสถูกรางวัล เลขที่ไม่เคยออกไม่ได้มีโอกาสเพิ่มขึ้นในงวดถัดไป',
              )}
            </p>
          </>
        )}
      </div>
    </details>
  );
}

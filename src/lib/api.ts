import { t } from './i18n';
import { parseDraws } from './data';
let pending: ReturnType<typeof request> | null = null;
async function request() {
  const response = await fetch('/api/history', {
    cache: 'no-store',
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok)
    throw new Error(t('ยังตรวจสอบงวดล่าสุดไม่ได้ กำลังใช้ข้อมูลที่บันทึกไว้'));
  const payload = await response.json();
  if (!['current', 'stale'].includes(payload.status))
    throw new Error(t('รูปแบบข้อมูลจากบริการผลสลากไม่ถูกต้อง'));
  return {
    draws: parseDraws(payload.draws).map((draw) => ({
      ...draw,
      source: 'sanook' as const,
    })),
    status: payload.status as 'current' | 'stale',
    checkedAt: typeof payload.checkedAt === 'string' ? payload.checkedAt : null,
  };
}
export function getHistory() {
  if (!pending)
    pending = request().finally(() => {
      pending = null;
    });
  return pending;
}

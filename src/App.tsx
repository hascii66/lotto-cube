import { t, tx } from './lib/i18n';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  BookOpen,
  ChartColumn,
  ChartNoAxesCombined,
  Check,
  CircleHelp,
  Database,
  FileUp,
  FlaskConical,
  Grid2X2,
  LayoutDashboard,
  Menu,
  Plus,
  LoaderCircle,
  SearchCheck,
  ShieldCheck,
  SlidersHorizontal,
  WifiOff,
  X,
} from 'lucide-react';
import { useDraws } from './hooks/useDraws';
import { useUrlState } from './hooks/useUrlState';
import { analyzeThree, prizeLabels, selectDraws } from './lib/analytics';
import { formatDate, weekdays } from './lib/format';
import { exportJson } from './lib/data';
import type { PrizeType, View } from './lib/types';
import { DataManager, type DataAction } from './components/DataManager';
import { LatestDraw, Metrics, ThreeAnalytics } from './components/Overview';
import { TopLastNumbers } from './components/TopLastNumbers';
import { TwoAnalytics } from './components/TwoAnalytics';
import { Scorer } from './components/Scorer';
import { History } from './components/History';
import { Empty, Formula, Panel } from './components/ui';
import { Preferences, usePreferences } from './components/Preferences';
const getNavigation = () => [
  { view: 'overview' as const, label: t('ภาพรวมสถิติ'), icon: LayoutDashboard },
  {
    view: 'three' as const,
    label: t('วิเคราะห์เลข 3 ตัว'),
    icon: ChartColumn,
    badge: '3D',
  },
  {
    view: 'two' as const,
    label: t('วิเคราะห์เลข 2 ตัว'),
    icon: Grid2X2,
    badge: '2D',
  },
  { view: 'scorer' as const, label: t('ตรวจคะแนนเลข'), icon: SearchCheck },
  { view: 'history' as const, label: t('ฐานข้อมูลย้อนหลัง'), icon: Database },
];
const getPageContent = (): Record<
  View,
  {
    title: string;
    description: string;
    eyebrow: string;
  }
> => ({
  overview: {
    title: t('ทุกตัวเลข มีเรื่องราว'),
    description: t(
      'สำรวจสถิติหวยไทยย้อนหลัง เปลี่ยนข้อมูลที่มีให้เป็นความเข้าใจ',
    ),
    eyebrow: 'THE LOTTERY, THROUGH DATA',
  },
  three: {
    title: t('มองให้ลึก ครบทั้ง 3 หลัก'),
    description: t(
      'ความถี่รายหลัก โครงสร้างเลข และแต้มรวม จากผลรางวัลที่บันทึกไว้',
    ),
    eyebrow: '3-DIGIT ANALYTICS',
  },
  two: {
    title: t('100 ตัวเลข ในภาพเดียว'),
    description: t('สำรวจเลขท้าย 2 ตัวผ่านแผนที่ความถี่และสถิติแยกรายหลัก'),
    eyebrow: '2-DIGIT ANALYTICS',
  },
  scorer: {
    title: t('เลขที่สนใจ บอกอะไรได้บ้าง'),
    description: t('ตรวจคะแนนจากสถิติ พร้อมย้อนดูประวัติเลขตรงและเลขกลับ'),
    eyebrow: 'YOUR NUMBER, IN CONTEXT',
  },
  history: {
    title: t('ข้อมูลจริง จุดเริ่มต้นของสถิติ'),
    description: t('ค้นหา ตรวจสอบ และจัดการผลรางวัลย้อนหลังในคลังของคุณ'),
    eyebrow: 'THE DRAW ARCHIVE',
  },
  guide: {
    title: t('เข้าใจตัวเลข ก่อนตีความ'),
    description: t('ที่มาของข้อมูล วิธีคำนวณ และขอบเขตของสถิติย้อนหลัง'),
    eyebrow: 'ABOUT LOTTOCUBE',
  },
});
export default function App() {
  const navigation = getNavigation();
  const pageContent = getPageContent();
  const { draws, warning, save, freshness } = useDraws();
  const { language } = usePreferences();
  const [state, update] = useUrlState();
  const [mobileNav, setMobileNav] = useState(false);
  const [narrow, setNarrow] = useState(
    () => matchMedia('(max-width: 800px)').matches,
  );
  const menuRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const [dataAction, setDataAction] = useState<DataAction | null>(null);
  const [toast, setToast] = useState('');
  const [offline, setOffline] = useState(!navigator.onLine);
  const [scorerInitial, setScorerInitial] = useState({
    number: '',
    mode: '3' as '2' | '3',
    key: 0,
  });
  const filtered = useMemo(
    () => selectDraws(draws, state),
    [draws, state.limit, state.weekday],
  );
  const stats = useMemo(
    () => analyzeThree(filtered, state.prize),
    [filtered, state.prize],
  );
  const latest = draws[0];
  const content = pageContent[state.view];
  useEffect(() => {
    document.title = `${content.title} | LottoCube`;
  }, [content.title, language]);
  useEffect(() => {
    const online = () => setOffline(!navigator.onLine);
    window.addEventListener('online', online);
    window.addEventListener('offline', online);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', online);
    };
  }, []);
  useEffect(() => {
    setToast('');
  }, [language]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 6500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    const media = matchMedia('(max-width: 800px)');
    const resize = () => {
      setNarrow(media.matches);
      if (!media.matches) setMobileNav(false);
    };
    media.addEventListener('change', resize);
    return () => media.removeEventListener('change', resize);
  }, []);
  useEffect(() => {
    if (mobileNav) {
      sidebarRef.current
        ?.querySelector<HTMLButtonElement>('.mobile-close')
        ?.focus();
      const onEscape = (e: KeyboardEvent) => {
        if (document.querySelector('dialog[open]')) return;
        if (e.key === 'Escape') setMobileNav(false);
      };
      window.addEventListener('keydown', onEscape);
      return () => {
        window.removeEventListener('keydown', onEscape);
        menuRef.current?.focus();
      };
    }
  }, [mobileNav]);
  function navigate(view: View) {
    update({ view }, true);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function openScorer(number: string, mode: '2' | '3' = '3') {
    setScorerInitial((s) => ({ number, mode, key: s.key + 1 }));
    navigate('scorer');
  }
  function success(message: string, history = false) {
    setToast(message);
    if (history) {
      setDataAction(null);
      update({ view: 'history', query: '', page: 1 }, true);
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {tx('ข้ามไปยังเนื้อหาหลัก')}
      </a>
      <aside
        ref={sidebarRef}
        inert={narrow && !mobileNav}
        className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}
        aria-label={t('เมนูหลัก')}
      >
        <a
          className="brand"
          href="?view=overview"
          onClick={(e) => {
            e.preventDefault();
            navigate('overview');
          }}
        >
          <span className="brand-mark">
            <ChartNoAxesCombined size={25} strokeWidth={2.2} />
          </span>
          <span>
            Lotto<span>Cube</span>
            <small>THAI LOTTERY ANALYTICS</small>
          </span>
        </a>
        <button
          className="icon-button mobile-close"
          onClick={() => setMobileNav(false)}
          aria-label={t('ปิดเมนู')}
        >
          <X size={20} />
        </button>
        <div className="workspace-label">
          <span className="workspace-dot" />
          <span>{tx('ห้องแล็บของคุณ')}</span>
          <span className="mini-version">V.1.0</span>
        </div>
        <p className="nav-label">{tx('สำรวจข้อมูล')}</p>
        <nav>
          {navigation.map(({ view, label, icon: Icon, badge }) => (
            <a
              key={view}
              href={`?view=${view}`}
              className={`nav-item ${state.view === view ? 'nav-active' : ''}`}
              aria-current={state.view === view ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                navigate(view);
              }}
            >
              <Icon size={19} strokeWidth={1.7} />
              <span>{label}</span>
              {badge && <span className="nav-badge mono">{badge}</span>}
            </a>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <p className="nav-label">{tx('คลังข้อมูล')}</p>
        <div className="data-tools">
          <button onClick={() => setDataAction('add')}>
            <Plus size={18} />
            {tx('เพิ่มผลสลากงวดใหม่')}
          </button>
          <button onClick={() => setDataAction('import')}>
            <FileUp size={18} />
            {tx('นำเข้า JSON')}
          </button>
          <button
            onClick={() => {
              exportJson(draws);
              setToast(t('ส่งออกไฟล์ JSON แล้ว'));
            }}
          >
            <ArrowDownToLine size={18} />
            {tx('ส่งออกข้อมูล')}
          </button>
        </div>
        <div className="sidebar-bottom">
          <div className="workspace-note">
            <FlaskConical size={21} />
            <strong>{tx('ข้อมูลจริง สูตรโปร่งใส')}</strong>
            <p>
              {tx('สำรวจสิ่งที่เกิดขึ้นแล้ว')}
              <br />
              {tx('ด้วยความเข้าใจที่มากขึ้น')}
            </p>
            <button onClick={() => navigate('guide')}>
              {tx('รู้จักวิธีอ่านสถิติ')}
              <ArrowUpRight size={15} />
            </button>
          </div>
          <a
            className="guide-link"
            href="?view=guide"
            onClick={(e) => {
              e.preventDefault();
              navigate('guide');
            }}
            aria-current={state.view === 'guide' ? 'page' : undefined}
          >
            <CircleHelp size={18} />
            {tx('คู่มือและที่มาข้อมูล')} <ArrowUpRight size={14} />
          </a>
          <div className="local-status">
            <span className="status-dot" />
            {tx('บันทึกบนอุปกรณ์นี้')} <ShieldCheck size={15} />
          </div>
        </div>
      </aside>
      {mobileNav && (
        <button
          className="nav-scrim"
          aria-label={t('ปิดเมนูหลัก')}
          onClick={() => setMobileNav(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button menu-button"
              ref={menuRef}
              aria-label={t('เปิดเมนูหลัก')}
              aria-expanded={mobileNav}
              onClick={() => setMobileNav(!mobileNav)}
            >
              <Menu size={21} />
            </button>
            <span className="desktop-breadcrumb">{tx('ห้องแล็บ')}</span>
            <span className="breadcrumb-slash">/</span>
            <span>
              {state.view === 'guide'
                ? t('คู่มือและที่มาข้อมูล')
                : navigation.find((n) => n.view === state.view)?.label}
            </span>
          </div>
          <div className="header-metadata">
            <span className="database-pill">
              <i />{' '}
              {['history', 'guide'].includes(state.view)
                ? t('{0} งวดในคลัง', [draws.length])
                : t('{0} งวดที่วิเคราะห์', [filtered.length])}
            </span>
            <span className="latest-date">
              {tx('งวดล่าสุด')}
              <b>{latest ? formatDate(latest.date, true) : '—'}</b>
            </span>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <span className="eyebrow">{content.eyebrow}</span>
              <h1>
                {content.title}
                <span className="title-dot">.</span>
              </h1>
              <p>{content.description}</p>
            </div>
            <Preferences />
          </div>
          <div className={`freshness-note ${freshness}`} role="status">
            {freshness === 'checking' && !offline ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <ShieldCheck size={16} />
            )}
            <span>
              {offline
                ? t('ออฟไลน์ · ใช้ข้อมูลที่บันทึกไว้')
                : freshness === 'checking'
                  ? t('กำลังตรวจสอบงวดล่าสุดอัตโนมัติ')
                  : freshness === 'current'
                    ? t('ข้อมูลครบถึงงวดที่ประกาศล่าสุด · ตรวจสอบอัตโนมัติ')
                    : t(
                        'ยังตรวจสอบงวดล่าสุดไม่ได้ · ใช้ข้อมูลที่บันทึกไว้และจะลองใหม่อัตโนมัติ',
                      )}
            </span>
          </div>
          {(offline || warning) && (
            <div className="warning-box global-notice" role="status">
              {offline && (
                <span>
                  <WifiOff size={17} />
                  {tx(
                    'คุณออฟไลน์อยู่ ข้อมูลที่บันทึกไว้ยังวิเคราะห์ได้ จะตรวจสอบงวดล่าสุดเมื่อกลับมาออนไลน์',
                  )}
                </span>
              )}
              {warning && <p>{t(warning)}</p>}
            </div>
          )}
          {state.view === 'overview' && latest && (
            <LatestDraw
              draw={latest}
              total={draws.length}
              onHistory={() => navigate('history')}
            />
          )}
          {state.view === 'overview' && <TopLastNumbers draws={draws} />}
          {!['history', 'guide'].includes(state.view) && (
            <div className="filter-bar">
              <div className="filter-label">
                <SlidersHorizontal size={17} />
                <span>{tx('ช่วงที่วิเคราะห์')}</span>
              </div>
              <div className="filter-control">
                <label htmlFor="filter-limit" className="sr-only">
                  {tx('จำนวนงวด')}
                </label>
                <select
                  id="filter-limit"
                  value={state.limit}
                  onChange={(e) =>
                    update({ limit: e.target.value as typeof state.limit })
                  }
                >
                  <option value="all">
                    {tx('ทั้งหมด')}
                    {draws.length}
                    {tx('งวด')}
                  </option>
                  <option value="20">{tx('20 งวดล่าสุด')}</option>
                  <option value="10">{tx('10 งวดล่าสุด')}</option>
                </select>
              </div>
              {state.view !== 'two' && (
                <div className="filter-control filter-prize">
                  <label className="sr-only" htmlFor="filter-prize">
                    {tx('ประเภทรางวัล')}
                  </label>
                  <select
                    id="filter-prize"
                    value={state.prize}
                    onChange={(e) =>
                      update({ prize: e.target.value as PrizeType })
                    }
                  >
                    {Object.entries(prizeLabels()).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="filter-control">
                <label htmlFor="filter-weekday" className="sr-only">
                  {tx('วันออกรางวัล')}
                </label>
                <select
                  id="filter-weekday"
                  value={state.weekday}
                  onChange={(e) => update({ weekday: e.target.value })}
                >
                  <option value="all">{tx('ทุกวันในสัปดาห์')}</option>
                  {weekdays().map((day, i) => (
                    <option key={day} value={i}>
                      {tx('วัน')}
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-result">
                <span className="status-dot" />
                {tx('ใช้')}
                {filtered.length}
                {tx('งวด')}
              </div>
            </div>
          )}
          {(state.view === 'overview' || state.view === 'three') && (
            <>
              <Metrics stats={stats} draws={filtered} />
              <div className="section-title">
                <div>
                  <span className="section-symbol">3D</span>
                  <h2>{tx('มองตัวเลขผ่านสถิติ')}</h2>
                </div>
                <span>
                  <Activity size={14} />
                  {tx('คำนวณจากข้อมูลในช่วงที่เลือก')}
                </span>
              </div>
              {!filtered.length && <Empty />}
              <ThreeAnalytics stats={stats} onScore={(n) => openScorer(n)} />
            </>
          )}
          {state.view === 'two' && (
            <TwoAnalytics
              draws={filtered}
              onScore={(n) => openScorer(n, '2')}
            />
          )}
          {state.view === 'scorer' && (
            <Scorer
              key={scorerInitial.key}
              draws={filtered}
              allDraws={draws}
              prize={state.prize}
              initial={scorerInitial.number}
              initialMode={scorerInitial.mode}
            />
          )}
          {state.view === 'history' && (
            <History
              draws={draws}
              query={state.query}
              page={state.page}
              onQuery={(query) => update({ query, page: 1 })}
              onPage={(page) => update({ page })}
              onAdd={() => setDataAction('add')}
            />
          )}
          {state.view === 'guide' && (
            <div className="guide-grid">
              <Panel
                title={t('เริ่มต้นจากข้อมูลที่ตรวจสอบได้')}
                eyebrow="DATA PROVENANCE"
                aside={<BookOpen size={22} />}
              >
                <p>
                  {tx(
                    'ใช้ข้อมูลจริงย้อนหลัง 10 ปีจากไฟล์ lotto-history.json ที่ดึงจาก Sanook แอปตรวจสอบงวดล่าสุดจากแหล่งข้อมูลเมื่อเปิดและกลับมาใช้งาน หากข้อมูลครบจะใช้ของเดิม หากมีงวดขาดจะเติมให้ครบโดยอัตโนมัติ',
                  )}
                </p>
                <p>
                  {tx(
                    'วันที่ “งวดล่าสุด” หมายถึงงวดใหม่ที่สุดในคลัง ดูสถานะการตรวจสอบควบคู่กัน หากออฟไลน์ยังวิเคราะห์ข้อมูลเดิมได้ และตรวจใหม่เมื่อออนไลน์',
                  )}
                </p>
                <p>
                  {tx('ข้อมูลจาก')}{' '}
                  <a
                    href="https://news.sanook.com/lotto/archive/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Sanook archive <ArrowUpRight size={13} />
                  </a>{' '}
                  {tx(
                    'ซึ่งเป็นบริการภายนอก หากใช้ตรวจรางวัล ควรตรวจซ้ำกับสำนักงานสลากกินแบ่งรัฐบาล',
                  )}
                </p>
                <p>
                  {tx(
                    'ฐานข้อมูลกลางเก็บบนเซิร์ฟเวอร์ ส่วนข้อมูลที่เพิ่มเองและการตั้งค่าเก็บบนอุปกรณ์ ไม่มีระบบบัญชี ส่งออก JSON เพื่อสำรองก่อนล้างข้อมูลเบราว์เซอร์',
                  )}
                </p>
              </Panel>
              <Panel
                title={t('อ่านกราฟอย่างเข้าใจ')}
                eyebrow="READING THE NUMBERS"
              >
                <ul className="reading-guide">
                  <li>
                    <b>{tx('ความถี่รายหลัก')}</b>
                    <span>
                      {tx(
                        'นับเลข 0–9 ในแต่ละตำแหน่ง เส้นประคือค่าคาดหวัง 10% เลขที่ความถี่เท่ากันเรียงตามตัวเลข และไฮไลท์ 3 อันดับ',
                      )}
                    </span>
                  </li>
                  <li>
                    <b>{tx('โครงสร้างเลข')}</b>
                    <span>
                      {tx(
                        'จากเลข 000–999 มีเลขไม่ซ้ำ 72% เลขซ้ำ 2 หลัก 27% และเลขตอง 1% ป้ายความต่าง ≥10 จุดเป็นเพียงเกณฑ์แสดงผล ไม่ใช่การทดสอบนัยสำคัญ',
                      )}
                    </span>
                  </li>
                  <li>
                    <b>{tx('ต่ำ–สูง และคู่–คี่')}</b>
                    <span>
                      {tx(
                        'เลขต่ำ 000–499 เลขสูง 500–999 ส่วนคู่–คี่ดูจากผลรวมเลขโดด ค่าทฤษฎีแต่ละกลุ่มคือ 50%',
                      )}
                    </span>
                  </li>
                  <li>
                    <b>{tx('กรองตามวัน')}</b>
                    <span>
                      {tx(
                        'เลือกวันในสัปดาห์ก่อน แล้วจึงใช้จำนวนงวดล่าสุด ตัวอย่างวันจันทร์ 10 งวด คือ 10 งวดล่าสุดที่ออกวันจันทร์',
                      )}
                    </span>
                  </li>
                </ul>
              </Panel>
              <Panel
                title={t('คะแนนไม่ใช่คำทำนาย')}
                eyebrow="TRANSPARENT BY DESIGN"
              >
                <p>
                  {tx(
                    'คะแนนใช้เปรียบเทียบความสอดคล้องกับข้อมูลย้อนหลังเท่านั้น คะแนน 90 ไม่ได้แปลว่ามีโอกาสถูก 90% ในการสุ่มเลขอย่างเท่าเทียม เลขแต่ละชุดมีโอกาสเท่ากัน และผลครั้งก่อนหน้าไม่ได้ทำให้เลขหนึ่ง “ถึงเวลาออก”',
                  )}
                </p>
                <Formula picks />
                <div className="info-box">
                  {tx(
                    'ข้อมูลจำนวนงวดน้อยอาจมีความผันผวนสูง ควรดูจำนวนชุดข้อมูลควบคู่กับเปอร์เซ็นต์เสมอ',
                  )}
                </div>
              </Panel>
            </div>
          )}
          <footer className="footer">
            <div>
              <FlaskConical size={17} />
              <span>{tx('สร้างความเข้าใจ จากสิ่งที่เกิดขึ้นจริง')}</span>
            </div>
            <p>
              {tx(
                'วิเคราะห์สถิติในอดีตเพื่อการศึกษาเท่านั้น ไม่สามารถทำนายหรือรับประกันผลรางวัลได้',
              )}
            </p>
            <span className="footer-edition">
              LOTTOCUBE · REAL DATA EDITION
            </span>
          </footer>
        </main>
      </div>
      <div
        className={`toast ${toast ? 'toast-visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        {toast && (
          <>
            <span className="toast-icon">
              <Check size={17} />
            </span>
            <span>{toast}</span>
            <button
              className="icon-button"
              aria-label={t('ปิดข้อความแจ้งเตือน')}
              onClick={() => setToast('')}
            >
              <X size={16} />
            </button>
          </>
        )}
      </div>
      {dataAction && (
        <DataManager
          action={dataAction}
          draws={draws}
          save={save}
          onClose={() => setDataAction(null)}
          onSuccess={success}
        />
      )}
    </div>
  );
}

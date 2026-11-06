import { getLanguage, t, tx } from './lib/i18n';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  BookOpen,
  ChartColumn,
  ChevronDown,
  Check,
  CircleHelp,
  Database,
  FileUp,
  FlaskConical,
  Grid2X2,
  Home,
  History as HistoryIcon,
  LayoutDashboard,
  Menu,
  Plus,
  LoaderCircle,
  Search,
  SearchCheck,
  ShieldCheck,
  SlidersHorizontal,
  WifiOff,
  X,
  Boxes,
} from 'lucide-react';
import { useDraws } from './hooks/useDraws';
import { useUrlState } from './hooks/useUrlState';
import { analyzeThree, prizeLabels, selectDraws } from './lib/analytics';
import { formatDate, weekdays } from './lib/format';
import { exportJson } from './lib/data';
import type { PrizeType, View } from './lib/types';
import { DataManager, type DataAction } from './components/DataManager';
import { LatestDraw, Metrics, ThreeAnalytics } from './components/Overview';
import { TopDrawPicks } from './components/TopDrawPicks';
import { TwoAnalytics } from './components/TwoAnalytics';
import { Scorer } from './components/Scorer';
import { History } from './components/History';
import { Empty, Formula, Panel } from './components/ui';
import { Preferences, usePreferences } from './components/Preferences';
const getNavigation = () => [
  { view: 'overview' as const, label: t('picks'), icon: LayoutDashboard },
  {
    view: 'three' as const,
    label: t('analyze_three_digits'),
    icon: ChartColumn,
    badge: '3D',
  },
  {
    view: 'two' as const,
    label: t('analyze_two_digits'),
    icon: Grid2X2,
    badge: '2D',
  },
  { view: 'scorer' as const, label: t('score_a_number'), icon: SearchCheck },
  { view: 'history' as const, label: t('historical_database'), icon: Database },
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
    title: t('picks_and_past_results'),
    description: t('choose_number_explore_history'),
    eyebrow: 'LOTTOCUBE',
  },
  three: {
    title: t('a_closer_look_at_all_three'),
    description: t(
      'position_frequencies_number_patterns_and_digit',
    ),
    eyebrow: '3-DIGIT ANALYTICS',
  },
  two: {
    title: t('one_hundred_numbers_one_clear_view'),
    description: t('explore_two_digit_results_through_a'),
    eyebrow: '2-DIGIT ANALYTICS',
  },
  scorer: {
    title: t('put_your_numbers_in_context'),
    description: t('compare_historical_scores_and_explore_exact'),
    eyebrow: 'YOUR NUMBER, IN CONTEXT',
  },
  history: {
    title: t('good_statistics_start_with_real_data'),
    description: t('search_review_and_manage_your_historical'),
    eyebrow: 'THE DRAW ARCHIVE',
  },
  guide: {
    title: t('understand_the_numbers_first'),
    description: t('data_sources_transparent_formulas_and_the'),
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
  const lastTriggerRef = useRef<HTMLElement | null>(null);
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

  const showSidebarTools = !narrow;
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
        if (e.key === 'Escape') {
          setMobileNav(false);
          (lastTriggerRef.current || menuRef.current)?.focus();
        }
      };
      window.addEventListener('keydown', onEscape);
      return () => {
        window.removeEventListener('keydown', onEscape);
        (lastTriggerRef.current || menuRef.current)?.focus();
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
    <div className={`app-shell${state.view === 'overview' ? ' app-home' : ''}`}>
      <a className="skip-link" href="#main-content">
        {tx('skip_to_main_content')}
      </a>
      <aside
        id="main-navigation"
        ref={sidebarRef}
        inert={narrow && !mobileNav}
        className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}
        aria-label={t('main_navigation')}
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
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#ff9e18" d="M24 3 45 15 24 27 3 15z" />
              <path fill="#0868cf" d="M3 15 22 26v21L3 36z" />
              <path fill="#e94d55" d="m45 15-19 11v21l19-11z" />
            </svg>
          </span>
          <span>
            Lotto<span>Cube</span>
            <small>THAI LOTTERY ANALYTICS</small>
          </span>
        </a>
        <button
          className="icon-button mobile-close"
          onClick={() => setMobileNav(false)}
          aria-label={t('close_navigation')}
        >
          <X size={20} />
        </button>
        <div className="workspace-label">
          <span className="workspace-dot" />
          <span>{tx('lotto-cube')}</span>
          <span className="mini-version">V.0.1</span>
        </div>
        {narrow && <Preferences />}
        <p className="nav-label">{tx('explore')}</p>
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
        {showSidebarTools && (
          <>
            <p className="nav-label">{tx('data_library')}</p>
            <div className="data-tools">
              <button onClick={() => setDataAction('add')}>
                <Plus size={18} />
                {tx('add_a_draw')}
              </button>
              <button onClick={() => setDataAction('import')}>
                <FileUp size={18} />
                {tx('import_json')}
              </button>
              <button
                onClick={() => {
                  exportJson(draws);
                  setToast(t('json_exported'));
                }}
              >
                <ArrowDownToLine size={18} />
                {tx('export_data')}
              </button>
            </div>
            <div className="sidebar-bottom">
              <div className="workspace-note">
                <FlaskConical size={21} />
                <strong>{tx('real_data_open_formulas')}</strong>
                <p>
                  {tx('explore_what_happened')}
                  <br />
                  {tx('with_a_clearer_understanding')}
                </p>
                <button onClick={() => navigate('guide')}>
                  {tx('how_to_read_the_statistics')}
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
                {tx('guide_data_sources')} <ArrowUpRight size={14} />
              </a>
              <div className="local-status">
                <span className="status-dot" />
                {tx('saved_on_this_device')} <ShieldCheck size={15} />
              </div>
            </div>
          </>
        )}
      </aside>
      {mobileNav && (
        <button
          className="nav-scrim"
          aria-label={t('close_main_navigation')}
          onClick={() => setMobileNav(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <a
              className="mobile-brand"
              href="?view=overview"
              onClick={(event) => {
                event.preventDefault();
                navigate('overview');
              }}
            >
              <span className="brand-mark mobile-brand-mark" aria-hidden="true">
                <svg viewBox="0 0 48 48">
                  <path fill="#ff9e18" d="M24 3 45 15 24 27 3 15z" />
                  <path fill="#0868cf" d="M3 15 22 26v21L3 36z" />
                  <path fill="#e94d55" d="m45 15-19 11v21l19-11z" />
                </svg>
              </span>
              <span>
                Lotto<span>Cube</span>
              </span>
            </a>
            <span className="desktop-breadcrumb">{tx('workspace')}</span>
            <span className="breadcrumb-slash">/</span>
            <span>
              {state.view === 'guide'
                ? t('guide_data_sources')
                : navigation.find((n) => n.view === state.view)?.label}
            </span>
          </div>
          <div className="header-metadata">
            <span className="database-pill">
              <i />{' '}
              {['overview', 'history', 'guide'].includes(state.view)
                ? t('stored_draws', [draws.length])
                : t('analyzed_draws', [filtered.length])}
            </span>
            <span className="latest-date">
              {tx('latest_draw')}
              <b>{latest ? formatDate(latest.date, true) : '—'}</b>
            </span>
          </div>
          {narrow ? (
            <button
              className="icon-button search-button"
              aria-label={t('check_numbers')}
              onClick={() => navigate('scorer')}
            >
              <Search size={24} />
            </button>
          ) : (
            <Preferences />
          )}
          <button
            ref={menuRef}
            className="icon-button menu-button"
            aria-label={t('open_main_navigation')}
            aria-expanded={mobileNav}
            aria-controls="main-navigation"
            onClick={(event) => {
              lastTriggerRef.current = event.currentTarget;
              setMobileNav(true);
            }}
          >
            <Menu size={22} />
          </button>
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
          </div>
          <div className={`freshness-note ${freshness}`} role="status">
            {freshness === 'checking' && !offline ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <ShieldCheck size={16} />
            )}
            <span>
              {offline
                ? t('offline_using_saved_data')
                : freshness === 'checking'
                  ? t('checking_the_latest_published_draw_automatically')
                  : freshness === 'current'
                    ? t('complete_through_the_latest_published_draw')
                    : t(
                        'latest_draw_unverified_using_saved_data',
                      )}
            </span>
          </div>
          {(offline || warning) && (
            <div className="warning-box global-notice" role="status">
              {offline && (
                <span>
                  <WifiOff size={17} />
                  {tx(
                    'you_are_offline_saved_data_remains',
                  )}
                </span>
              )}
              {warning && <p>{t(warning)}</p>}
            </div>
          )}
          {state.view === 'overview' && (
            <TopDrawPicks
              draws={draws}
              targetDate={state.pickDraw}
              onTargetChange={(pickDraw) => update({ pickDraw }, true)}
              digits={state.pickDigits}
              onDigitsChange={(pickDigits) => update({ pickDigits })}
              onNavigate={navigate}
            />
          )}
          {state.view === 'overview' && latest && (
            <details className="latest-peek">
              <summary>
                <span>
                  {t('latest_stored_result')}{' '}
                  <time dateTime={latest.date}>
                    {formatDate(latest.date, true)}
                  </time>
                </span>
                <strong className="mono">{latest.prize1}</strong>
                <ChevronDown size={16} aria-hidden="true" />
              </summary>
              <LatestDraw
                draw={latest}
                total={draws.length}
                onHistory={() => navigate('history')}
              />
            </details>
          )}
          {['three', 'two', 'scorer'].includes(state.view) && (
            <div className="filter-bar">
              <div className="filter-label">
                <SlidersHorizontal size={17} />
                <span>{tx('analysis_period')}</span>
              </div>
              <div className="filter-control">
                <label htmlFor="filter-limit" className="sr-only">
                  {tx('draw_count')}
                </label>
                <select
                  id="filter-limit"
                  value={state.limit}
                  onChange={(e) =>
                    update({ limit: e.target.value as typeof state.limit })
                  }
                >
                  <option value="all">
                    {tx('all')}
                    {draws.length}
                    {tx('draws')}
                  </option>
                  <option value="20">{tx('latest_20_draws')}</option>
                  <option value="10">{tx('latest_10_draws')}</option>
                </select>
              </div>
              {state.view !== 'two' && (
                <div className="filter-control filter-prize">
                  <label className="sr-only" htmlFor="filter-prize">
                    {tx('award_type')}
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
                  {tx('draw_weekday')}
                </label>
                <select
                  id="filter-weekday"
                  value={state.weekday}
                  onChange={(e) => update({ weekday: e.target.value })}
                >
                  <option value="all">{tx('any_weekday')}</option>
                  {weekdays().map((day, i) => (
                    <option key={day} value={i}>
                      {getLanguage() === 'th' ? `วัน${day}` : day}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-result">
                <span className="status-dot" />
                {tx('using')}
                {filtered.length}
                {tx('draws')}
              </div>
            </div>
          )}
          {state.view === 'three' && (
            <>
              <Metrics stats={stats} draws={filtered} />
              <div className="section-title">
                <div>
                  <span className="section-symbol">3D</span>
                  <h2>{tx('see_the_numbers_through_statistics')}</h2>
                </div>
                <span>
                  <Activity size={14} />
                  {tx('calculated_from_your_selected_period')}
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
                title={t('start_with_traceable_data')}
                eyebrow="DATA PROVENANCE"
                aside={<BookOpen size={22} />}
              >
                <p>
                  {tx(
                    'the_app_uses_ten_years_of',
                  )}
                </p>
                <p>
                  {tx(
                    'latest_draw_means_the_newest_result',
                  )}
                </p>
                <p>
                  {tx('results_from')}{' '}
                  <a
                    href="https://news.sanook.com/lotto/archive/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Sanook archive <ArrowUpRight size={13} />
                  </a>{' '}
                  {tx(
                    'an_external_source_always_verify_prize',
                  )}
                </p>
                <p>
                  {tx(
                    'the_server_maintains_the_shared_archive',
                  )}
                </p>
              </Panel>
              <Panel
                title={t('read_the_charts_with_confidence')}
                eyebrow="READING THE NUMBERS"
              >
                <ul className="reading-guide">
                  <li>
                    <b>{tx('frequency_by_position')}</b>
                    <span>
                      {tx(
                        'digits_0_9_are_counted_in',
                      )}
                    </span>
                  </li>
                  <li>
                    <b>{tx('number_patterns')}</b>
                    <span>
                      {tx(
                        'of_all_numbers_000_999_72',
                      )}
                    </span>
                  </li>
                  <li>
                    <b>{tx('low_high_and_even_odd')}</b>
                    <span>
                      {tx(
                        'low_means_000_499_and_high',
                      )}
                    </span>
                  </li>
                  <li>
                    <b>{tx('filter_by_weekday')}</b>
                    <span>
                      {tx(
                        'weekday_filtering_comes_first_then_the',
                      )}
                    </span>
                  </li>
                </ul>
              </Panel>
              <Panel
                title={t('scores_are_not_predictions')}
                eyebrow="TRANSPARENT BY DESIGN"
              >
                <p>
                  {tx(
                    'scores_describe_historical_alignment_only_a',
                  )}
                </p>
                <Formula picks />
                <div className="info-box">
                  {tx(
                    'small_samples_can_fluctuate_substantially_always',
                  )}
                </div>
              </Panel>
            </div>
          )}
          <footer className="footer">
            <div>
              <FlaskConical size={17} />
              <span>{tx('understanding_grounded_in_real_results')}</span>
            </div>
            <p>
              {tx(
                'historical_analysis_for_education_only_it',
              )}
            </p>
            <span className="footer-edition">
              LOTTOCUBE · REAL DATA EDITION
            </span>
          </footer>
        </main>
      </div>
      <nav className="mobile-bottom-nav" aria-label={t('mobile_shortcuts')}>
        {(
          [
            { view: 'overview', label: t('picks'), Icon: Home },
            { view: 'three', label: t('three_digits'), Icon: Boxes },
            { view: 'two', label: t('two_digits'), Icon: Grid2X2 },
            { view: 'scorer', label: t('check_numbers'), Icon: SearchCheck },
            { view: 'history', label: t('archive'), Icon: HistoryIcon },
          ] as const
        ).map(({ view, label, Icon }) => (
          <a
            key={view}
            href={`?view=${view}`}
            aria-current={state.view === view ? 'page' : undefined}
            onClick={(event) => {
              event.preventDefault();
              navigate(view);
            }}
          >
            <Icon size={21} aria-hidden="true" />
            <span>{label}</span>
          </a>
        ))}
      </nav>
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
              aria-label={t('dismiss_notification')}
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

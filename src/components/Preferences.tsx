import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Download, Monitor, Moon, Sun } from 'lucide-react';
import { getLanguage, setLanguage, type Language, t, tx } from '../lib/i18n';
import { Modal } from './ui';
import { usePwa } from '../hooks/usePwa';
type Theme = 'system' | 'light' | 'dark';
const Context = createContext({
  language: 'th' as Language,
  theme: 'system' as Theme,
  changeLanguage: () => {},
  changeTheme: () => {},
});
export const usePreferences = () => useContext(Context);
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState(getLanguage);
  const [theme, updateTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('lottocube.theme');
      return saved === 'light' || saved === 'dark' ? saved : 'system';
    } catch {
      return 'system';
    }
  });
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved =
        theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', resolved === 'dark' ? '#11232d' : '#f5f7f9');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return (
    <Context.Provider
      value={{
        language,
        theme,
        changeLanguage: () => {
          const next = language === 'th' ? 'en' : 'th';
          setLanguage(next);
          updateLanguage(next);
        },
        changeTheme: () => {
          const next =
            theme === 'system'
              ? 'light'
              : theme === 'light'
                ? 'dark'
                : 'system';
          updateTheme(next);
          try {
            localStorage.setItem('lottocube.theme', next);
          } catch {
            /* Keep the current session usable. */
          }
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function Preferences() {
  const { language, theme, changeLanguage, changeTheme } = usePreferences();
  const { install, installed, updateReady, applyUpdate } = usePwa();
  const [instructions, setInstructions] = useState(false);
  const Icon = theme === 'system' ? Monitor : theme === 'dark' ? Moon : Sun;
  const themeNames = {
    system: t('ตามระบบ'),
    light: t('สว่าง'),
    dark: t('มืด'),
  };
  return (
    <div className="preferences">
      <button
        className="preference-button language-button"
        onClick={changeLanguage}
        aria-label={t('เปลี่ยนภาษา / Change language')}
      >
        {language === 'th' ? 'EN' : t('ไทย')}
      </button>
      <button
        className="preference-button"
        onClick={changeTheme}
        aria-label={t('ธีม: {0} · เปลี่ยนธีม', [t(themeNames[theme])])}
        title={t('ธีม: {0} · เปลี่ยนธีม', [t(themeNames[theme])])}
      >
        <Icon size={19} />
      </button>
      {!installed && (
        <button
          className="preference-button install-button"
          onClick={async () => {
            if (!(await install())) setInstructions(true);
          }}
          aria-label={t('ติดตั้งแอป')}
          title={t('ติดตั้งแอป')}
        >
          <Download size={18} />
          <span>{tx('ติดตั้งแอป')}</span>
        </button>
      )}
      {updateReady && (
        <button className="button button-small" onClick={applyUpdate}>
          {tx('ใช้เวอร์ชันใหม่')}
        </button>
      )}
      {instructions && (
        <Modal
          title={t('ติดตั้ง LottoCube')}
          description={t('เพิ่มแอปไว้บนหน้าจอหลักเพื่อเปิดใช้งานได้สะดวก')}
          onClose={() => setInstructions(false)}
        >
          <div className="install-instructions">
            <h3>iPhone / iPad</h3>
            <p>{tx('เปิดใน Safari → กดแชร์ → เพิ่มไปยังหน้าจอโฮม')}</p>
            <h3>Android / Chrome</h3>
            <p>{tx('เปิดเมนู ⋮ → ติดตั้งแอป หรือ เพิ่มลงในหน้าจอหลัก')}</p>
            <p>
              {tx(
                'หลังเปิดออนไลน์ครั้งแรกแล้ว แอปและข้อมูลที่บันทึกไว้จะเปิดใช้งานแบบออฟไลน์ได้ การอัปเดตผลสลากต้องเชื่อมต่ออินเทอร์เน็ต',
              )}
            </p>
          </div>
          <div className="modal-actions">
            <button
              className="button button-primary"
              onClick={() => setInstructions(false)}
            >
              {tx('เข้าใจแล้ว')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

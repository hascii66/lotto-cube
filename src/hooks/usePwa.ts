import { useEffect, useRef, useState } from 'react';

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export function usePwa() {
  const prompt = useRef<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(
    () =>
      matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
  );
  const [updateReady, setUpdateReady] = useState(false);
  const waiting = useRef<ServiceWorker | null>(null);
  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      prompt.current = event as InstallPrompt;
    };
    const onInstalled = () => {
      setInstalled(true);
      prompt.current = null;
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    let active = true;
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      void navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          const check = () => {
            if (
              active &&
              registration.waiting &&
              navigator.serviceWorker.controller
            ) {
              waiting.current = registration.waiting;
              setUpdateReady(true);
            }
          };
          check();
          registration.addEventListener('updatefound', () =>
            registration.installing?.addEventListener('statechange', check),
          );
        })
        .catch(() => {
          /* The app remains usable online when installation is unavailable. */
        });
    }
    return () => {
      active = false;
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  return {
    installed,
    updateReady,
    install: async () => {
      if (!prompt.current) return false;
      await prompt.current.prompt();
      const choice = await prompt.current.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      prompt.current = null;
      return true;
    },
    applyUpdate: () => {
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        () => location.reload(),
        { once: true },
      );
      waiting.current?.postMessage('SKIP_WAITING');
    },
  };
}

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

interface UsePWAReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  showManualInstall: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  install: () => Promise<void>;
  openInFullscreen: () => Promise<void>;
  isServiceWorkerReady: boolean;
  unregisterServiceWorker: () => Promise<void>;
}

export function usePWA(): UsePWAReturn {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showManualInstall, setShowManualInstall] = useState(false);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    const androidDevice = /android/.test(ua);
    const mobileDevice = iosDevice || androidDevice;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

    setIsIOS(iosDevice);
    setIsInstalled(isStandalone);
    setShowManualInstall(mobileDevice && !isStandalone);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      setShowManualInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for install success
    const handleAppInstalled = () => {
      console.log('✓ PWA installed successfully');
      setIsInstalled(true);
      setInstallPrompt(null);
      setIsInstallable(false);
      setShowManualInstall(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Register service worker
    registerServiceWorker();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('✓ Service worker registered:', registration);
        setIsServiceWorkerReady(true);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('✓ New service worker version available');
                // Show update notification
                window.dispatchEvent(new CustomEvent('sw-update-available'));
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  };

  const install = async () => {
    if (!installPrompt) {
      console.warn('Install prompt not available, use browser menu to install');
      setShowManualInstall(true);
      return;
    }

    try {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowManualInstall(false);
      } else {
        setShowManualInstall(true);
      }

      setInstallPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Installation failed:', error);
      setShowManualInstall(true);
    }
  };

  const openInFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      }
    } catch (error) {
      console.error('Failed to open fullscreen:', error);
    }
  };

  const unregisterServiceWorker = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        console.log('✓ All service workers unregistered');
        setIsServiceWorkerReady(false);
      }
    } catch (error) {
      console.error('Failed to unregister service worker:', error);
    }
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    showManualInstall,
    installPrompt,
    install,
    openInFullscreen,
    isServiceWorkerReady,
    unregisterServiceWorker,
  };
}

import { useEffect, useState } from 'react';
import { Share, Download, X } from 'lucide-react';

function usePwaInstallBanner() {
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (('standalone' in navigator) && (navigator as any).standalone);
    if (isStandalone || sessionStorage.getItem('pwa-banner-dismissed')) return;
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      setPlatform('ios');
      return;
    }
    // Android/Chrome: solo si el navegador ofrece instalación nativa. El evento
    // pudo dispararse antes de hidratar (lo captura RootLayout en window).
    if ((window as any).__fvInstallPrompt) setPlatform('android');
    const onReady = () => setPlatform('android');
    const onInstalled = () => setPlatform(null);
    window.addEventListener('fv-install-ready', onReady);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('fv-install-ready', onReady);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  const dismiss = () => {
    sessionStorage.setItem('pwa-banner-dismissed', '1');
    setPlatform(null);
  };
  const install = async () => {
    const prompt = (window as any).__fvInstallPrompt;
    if (!prompt) return;
    prompt.prompt();
    const choice = await prompt.userChoice.catch(() => null);
    (window as any).__fvInstallPrompt = null;
    if (choice?.outcome === 'accepted') setPlatform(null);
  };
  return { platform, dismiss, install };
}

// bottom: en la app el banner debe librar el bottom nav (bottom-20); en el
// login no hay nav, así que puede ir más abajo.
export function PwaInstallBanner({ bottom = 'bottom-20' }: { bottom?: string }) {
  const { platform, dismiss, install } = usePwaInstallBanner();
  if (!platform) return null;
  return (
    <div className={`fixed ${bottom} left-4 right-4 z-50 bg-card border border-border rounded-2xl p-4 shadow-xl flex items-start gap-3`}>
      <img src="/icons/icon-192.png" alt="Fitvang" className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Instala Fitvang</p>
        {platform === 'ios' ? (
          <p className="text-xs text-muted-foreground mt-0.5">
            Toca <Share size={11} className="inline mx-0.5" /> y luego <strong>"Agregar a inicio"</strong>
          </p>
        ) : (
          <button
            onClick={install}
            className="mt-2 flex items-center gap-1.5 px-3 h-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            <Download size={13} /> Instalar app
          </button>
        )}
      </div>
      <button onClick={dismiss} className="text-muted-foreground hover:text-foreground p-1">
        <X size={16} />
      </button>
    </div>
  );
}

export default PwaInstallBanner;

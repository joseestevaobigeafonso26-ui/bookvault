'use client';
import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

// Botão "Instalar app": só aparece quando dá para instalar (e desaparece depois de instalada)
export default function InstallApp({ className = '' }) {
  const [evt, setEvt] = useState(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [tip, setTip] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (standalone) { setInstalled(true); return; }
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e) => { e.preventDefault(); setEvt(e); };
    const onInstalled = () => { setInstalled(true); setEvt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || (!evt && !ios)) return null;

  async function click() {
    if (evt) { evt.prompt(); await evt.userChoice; setEvt(null); }
    else setTip((t) => !t);
  }

  return (
    <div className="relative">
      <button onClick={click} className={className}><Download size={16} /> <span className="hidden sm:inline">Instalar app</span></button>
      {tip && (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 pr-7 text-xs shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <button onClick={() => setTip(false)} aria-label="Fechar" className="absolute right-2 top-2 text-slate-400"><X size={12} /></button>
          Para instalar no iPhone: toca em <b>Partilhar</b> <Share size={12} className="inline" /> e depois em <b>Adicionar ao ecrã principal</b>.
        </div>
      )}
    </div>
  );
}

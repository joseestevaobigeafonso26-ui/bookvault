'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Barra de progresso no topo: arranca ao clicar num link interno e termina quando a página muda.
function Bar() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [w, setW] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef();
  const startedAt = useRef(0);

  const start = () => {
    clearInterval(timer.current);
    startedAt.current = Date.now();
    setVisible(true);
    setW(12);
    timer.current = setInterval(() => setW((x) => x + (90 - x) * 0.1), 200);
  };
  const done = () => {
    clearInterval(timer.current);
    // mantém a barra visível pelo menos 500 ms, mesmo em páginas muito rápidas
    const wait = startedAt.current ? Math.max(0, 500 - (Date.now() - startedAt.current)) : 0;
    setTimeout(() => {
      setW(100);
      setTimeout(() => { setVisible(false); setW(0); startedAt.current = 0; }, 250);
    }, wait);
  };

  useEffect(done, [pathname, search]);

  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.('a');
      if (!a || !a.href || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      start();
    };
    // fase de captura: corre antes do Next.js marcar o clique como tratado
    document.addEventListener('click', onClick, true);
    return () => { document.removeEventListener('click', onClick, true); clearInterval(timer.current); };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[60] h-1 bg-brand-600 shadow-[0_0_8px_#16a34a]"
      style={{ width: `${w}%`, opacity: visible ? 1 : 0, transition: 'width 200ms ease, opacity 200ms ease' }} />
  );
}

export default function TopProgress() {
  return <Suspense fallback={null}><Bar /></Suspense>;
}

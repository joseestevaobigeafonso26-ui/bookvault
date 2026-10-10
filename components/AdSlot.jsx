'use client';
import { useEffect, useRef } from 'react';

// Bloco de anúncio Google AdSense. Não mostra nada se o admin desativou ou faltam IDs.
export default function AdSlot({ client, slot, className = '' }) {
  const done = useRef(false);
  useEffect(() => {
    if (!client || !slot || done.current) return;
    done.current = true;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
  }, [client, slot]);
  if (!client || !slot) return null;
  return (
    <div className={`overflow-hidden ${className}`}>
      <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client={client} data-ad-slot={slot}
        data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}

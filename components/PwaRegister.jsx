'use client';
import { useEffect } from 'react';

// Regista o service worker (só no site publicado, não em desenvolvimento)
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}

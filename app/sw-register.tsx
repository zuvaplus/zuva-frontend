'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker at /sw.js.
 * Renders nothing — included once in the root layout.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[SW] registered — scope:', reg.scope);
      })
      .catch((err) => {
        console.error('[SW] registration failed:', err);
      });
  }, []);

  return null;
}

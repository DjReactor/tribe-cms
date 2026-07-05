'use client';

import { useEffect } from 'react';

/**
 * Fire-and-forget 404 beacon. Lives on the not-found page and reports the
 * missing URL to /api/track-404 once the 404 UI actually mounts in a browser.
 *
 * This is deliberately client-side: the server-rendered not-found component
 * is also rendered speculatively during ordinary page requests, so any
 * server-side logging there would count every 200 response as a 404.
 * A side benefit: JS-less bot probes (/.env, /wp-admin, …) never fire it.
 */
export function Track404() {
  useEffect(() => {
    try {
      fetch('/api/track-404', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: window.location.pathname,
          referrer: document.referrer || '',
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Tracking must never surface errors on the 404 page.
    }
  }, []);

  return null;
}

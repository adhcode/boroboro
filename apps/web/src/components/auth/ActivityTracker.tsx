'use client';

import { useEffect } from 'react';
import { authApi } from '@/lib/auth';

/**
 * Activity tracker component that monitors user activity
 * and enforces 30-minute session timeout
 */
export function ActivityTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize last activity timestamp
    authApi.updateActivity();

    // Events that count as user activity
    const activityEvents = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttled activity update (max once per 30 seconds)
    let lastUpdate = Date.now();
    const UPDATE_INTERVAL = 30 * 1000; // 30 seconds

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > UPDATE_INTERVAL) {
        authApi.updateActivity();
        lastUpdate = now;
      }
    };

    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check session timeout every minute
    const timeoutCheckInterval = setInterval(() => {
      authApi.checkSessionTimeout();
    }, 60 * 1000); // 1 minute

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(timeoutCheckInterval);
    };
  }, []);

  return null; // This component doesn't render anything
}

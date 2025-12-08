import { useEffect, useRef } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useAuth } from '@/hooks/useAuth';

export function NotificationChecker() {
  const { user } = useAuth();
  const { permission, checkAndNotify } = usePushNotifications();
  const { settings, getIntervalMs } = useNotificationSettings();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only run if user is logged in, permission granted, and interval is not off
    if (!user || permission !== 'granted' || settings.interval === 'off') {
      return;
    }

    // Initial check on app load with delay
    const initialTimer = setTimeout(() => {
      checkAndNotify();
    }, 3000);

    // Set up recurring interval
    const intervalMs = getIntervalMs();
    if (intervalMs) {
      intervalRef.current = setInterval(() => {
        checkAndNotify();
      }, intervalMs);
    }

    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, permission, settings.interval, checkAndNotify, getIntervalMs]);

  return null;
}

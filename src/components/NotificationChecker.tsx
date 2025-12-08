import { useEffect, useRef } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useAuth } from '@/hooks/useAuth';

export function NotificationChecker() {
  const { user } = useAuth();
  const { permission, requestPermission, checkAndNotify } = usePushNotifications();
  const { settings, getIntervalMs } = useNotificationSettings();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasRequestedPermission = useRef(false);

  // Auto-request permission on first load
  useEffect(() => {
    if (user && !hasRequestedPermission.current && permission === 'default' && settings.interval !== 'off') {
      hasRequestedPermission.current = true;
      requestPermission();
    }
  }, [user, permission, settings.interval, requestPermission]);

  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only run if user is logged in and interval is not off
    if (!user || settings.interval === 'off') {
      return;
    }

    // Initial check on app load with delay (works even without permission for local storage tracking)
    const initialTimer = setTimeout(() => {
      if (permission === 'granted') {
        checkAndNotify(settings.reminderDays);
      }
    }, 3000);

    // Set up recurring interval
    const intervalMs = getIntervalMs();
    if (intervalMs && permission === 'granted') {
      intervalRef.current = setInterval(() => {
        checkAndNotify(settings.reminderDays);
      }, intervalMs);
    }

    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, permission, settings.interval, settings.reminderDays, checkAndNotify, getIntervalMs]);

  return null;
}

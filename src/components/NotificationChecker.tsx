import { useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';

export function NotificationChecker() {
  const { user } = useAuth();
  const { permission, checkAndNotify } = usePushNotifications();

  useEffect(() => {
    // Check for expiring items and low stock when app loads
    if (user && permission === 'granted') {
      // Small delay to ensure data is loaded
      const timer = setTimeout(() => {
        checkAndNotify();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [user, permission, checkAndNotify]);

  return null;
}

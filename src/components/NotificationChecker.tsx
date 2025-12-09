import { useEffect, useRef, useCallback } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function NotificationChecker() {
  const { user } = useAuth();
  const { permission, isSupported, checkAndNotify } = usePushNotifications();
  const { settings, getIntervalMs } = useNotificationSettings();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasRunInitialCheck = useRef(false);

  const runCheck = useCallback(async () => {
    if (!user) return;
    
    console.log('Running notification check with settings:', settings);
    
    const results = await checkAndNotify(
      settings.reminderDays,
      settings.expiryAlerts,
      settings.lowStockAlerts
    );

    console.log('Notification check results:', results);

    // Show urgent toast notifications - more visible and longer duration
    if (results.expired > 0 && settings.expiryAlerts) {
      toast.error(`🚨 ئاگاداری! ${results.expired} مادە بەسەرچووە!`, {
        duration: 15000,
        id: 'expired-toast',
        position: 'top-center',
        style: {
          fontSize: '16px',
          padding: '16px 24px',
        },
      });
    }

    if (results.expiring > 0 && settings.expiryAlerts) {
      toast.warning(`⏰ ئاگاداری! ${results.expiring} مادە نزیکە بەسەربچێت`, {
        duration: 12000,
        id: 'expiring-toast',
        position: 'top-center',
        style: {
          fontSize: '16px',
          padding: '16px 24px',
        },
      });
    }

    if (results.lowStock > 0 && settings.lowStockAlerts) {
      toast.info(`📦 ئاگاداری! ${results.lowStock} مادە ستۆکی کەمە`, {
        duration: 10000,
        id: 'lowstock-toast',
        position: 'top-center',
        style: {
          fontSize: '16px',
          padding: '16px 24px',
        },
      });
    }
  }, [user, settings, checkAndNotify]);

  // Initial check when user logs in or settings change
  useEffect(() => {
    if (!user || settings.interval === 'off') {
      hasRunInitialCheck.current = false;
      return;
    }

    // Only run initial check once per session
    if (!hasRunInitialCheck.current && (settings.expiryAlerts || settings.lowStockAlerts)) {
      hasRunInitialCheck.current = true;
      
      // Quick check after login - only 2 seconds delay
      const initialTimer = setTimeout(() => {
        console.log('Running urgent notification check after login...');
        runCheck();
      }, 2000);

      return () => clearTimeout(initialTimer);
    }
  }, [user, settings.interval, settings.expiryAlerts, settings.lowStockAlerts, runCheck]);

  // Set up recurring interval
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

    // Check if any alerts are enabled
    if (!settings.expiryAlerts && !settings.lowStockAlerts) {
      console.log('All alerts disabled, skipping interval setup');
      return;
    }

    // Set up recurring interval
    const intervalMs = getIntervalMs();
    if (intervalMs) {
      console.log(`Setting up notification interval: every ${intervalMs / 1000 / 60} minutes`);
      
      intervalRef.current = setInterval(() => {
        console.log('Running scheduled notification check...');
        runCheck();
      }, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, settings.interval, settings.expiryAlerts, settings.lowStockAlerts, getIntervalMs, runCheck]);

  // Log current state for debugging
  useEffect(() => {
    console.log('NotificationChecker state:', {
      user: !!user,
      permission,
      isSupported,
      settings,
    });
  }, [user, permission, isSupported, settings]);

  return null;
}

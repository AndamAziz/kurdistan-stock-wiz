import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface NotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  token: string | null;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [state, setState] = useState<NotificationState>({
    permission: 'default',
    isSupported: false,
    token: null,
  });

  useEffect(() => {
    // Check if notifications are supported
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    setState(prev => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : 'denied',
    }));
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        // Show a test notification
        showLocalNotification('ئاگادارکردنەوەکان چالاک کران!', {
          body: 'ئێستا ئاگادارکردنەوەی بەسەرچوون و کەم ستۆک وەردەگریت',
          icon: '/pwa-192x192.png',
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [state.isSupported]);

  const showLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (state.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        dir: 'rtl',
        lang: 'ku',
        ...options,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [state.permission]);

  // Check for expiring items and show notifications
  const checkAndNotify = useCallback(async () => {
    if (!user || state.permission !== 'granted') return;

    try {
      const today = new Date();
      const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Fetch items that are expiring soon or have low stock
      const { data: items, error } = await supabase
        .from('items')
        .select('*')
        .or(`exp_date.lte.${thirtyDaysLater.toISOString().split('T')[0]},current_quantity.lte.min_stock`);

      if (error) throw error;

      const expiredItems = items?.filter(item => 
        item.exp_date && new Date(item.exp_date) < today
      ) || [];

      const expiringItems = items?.filter(item => {
        if (!item.exp_date) return false;
        const expDate = new Date(item.exp_date);
        return expDate > today && expDate <= thirtyDaysLater;
      }) || [];

      const lowStockItems = items?.filter(item => 
        item.current_quantity <= item.min_stock && item.current_quantity > 0
      ) || [];

      // Show notifications
      if (expiredItems.length > 0) {
        showLocalNotification('⚠️ مادەی بەسەرچوو!', {
          body: `${expiredItems.length} مادە بەسەرچووە و پێویستە لابدرێت`,
          tag: 'expired-items',
        });
      }

      if (expiringItems.length > 0) {
        showLocalNotification('⏰ نزیک بەسەرچوون', {
          body: `${expiringItems.length} مادە نزیکە بەسەرچێت`,
          tag: 'expiring-items',
        });
      }

      if (lowStockItems.length > 0) {
        showLocalNotification('📦 کەم ستۆک', {
          body: `${lowStockItems.length} مادە ستۆکی کەمە`,
          tag: 'low-stock-items',
        });
      }

    } catch (error) {
      console.error('Error checking items for notifications:', error);
    }
  }, [user, state.permission, showLocalNotification]);

  return {
    ...state,
    requestPermission,
    showLocalNotification,
    checkAndNotify,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

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
    const isSupported = 'Notification' in window;
    setState(prev => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : 'denied',
    }));
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      console.warn('Push notifications not supported');
      toast.error('ئەم براوزەرە ئاگادارکردنەوە پشتگیری ناکات');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        // Show a test notification
        showLocalNotification('✅ ئاگادارکردنەوەکان چالاک کران!', {
          body: 'ئێستا ئاگادارکردنەوەی بەسەرچوون و کەم ستۆک وەردەگریت',
          icon: '/pwa-192x192.png',
          requireInteraction: false,
        });
        toast.success('ئاگادارکردنەوەکان چالاک کران');
        return true;
      } else if (permission === 'denied') {
        toast.error('ڕێگەپێدان نەدرا - تکایە لە ڕێکخستنەکانی براوزەرەکەت چالاکی بکە');
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('هەڵە لە داواکردنی ڕێگەپێدان');
      return false;
    }
  }, [state.isSupported]);

  const showLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (state.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        dir: 'rtl',
        lang: 'ku',
        requireInteraction: true,
        ...options,
      });

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [state.permission]);

  // Check for expiring items and low stock - show notifications
  const checkAndNotify = useCallback(async (
    reminderDays: number = 30,
    showExpiryAlerts: boolean = true,
    showLowStockAlerts: boolean = true
  ) => {
    if (!user) {
      console.log('No user logged in, skipping notification check');
      return { expired: 0, expiring: 0, lowStock: 0 };
    }

    console.log('Checking for notifications...', { reminderDays, showExpiryAlerts, showLowStockAlerts });

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const reminderDate = new Date(today.getTime() + reminderDays * 24 * 60 * 60 * 1000);

      // Fetch all items
      const { data: items, error } = await supabase
        .from('items')
        .select('id, name, exp_date, current_quantity, min_stock, barcode');

      if (error) {
        console.error('Error fetching items:', error);
        throw error;
      }

      console.log('Fetched items:', items?.length);

      // Filter expired items
      const expiredItems = items?.filter(item => {
        if (!item.exp_date) return false;
        const expDate = new Date(item.exp_date);
        expDate.setHours(0, 0, 0, 0);
        return expDate < today;
      }) || [];

      // Filter items expiring soon (within reminder days)
      const expiringItems = items?.filter(item => {
        if (!item.exp_date) return false;
        const expDate = new Date(item.exp_date);
        expDate.setHours(0, 0, 0, 0);
        return expDate >= today && expDate <= reminderDate;
      }) || [];

      // Filter low stock items
      const lowStockItems = items?.filter(item => 
        item.current_quantity <= item.min_stock
      ) || [];

      console.log('Results:', {
        expired: expiredItems.length,
        expiring: expiringItems.length,
        lowStock: lowStockItems.length
      });

      // Show notifications only if permission is granted
      if (state.permission === 'granted') {
        // Expired items notification
        if (showExpiryAlerts && expiredItems.length > 0) {
          const itemNames = expiredItems.slice(0, 3).map(i => i.name).join('، ');
          const moreText = expiredItems.length > 3 ? ` و ${expiredItems.length - 3} مادەی تر` : '';
          
          showLocalNotification('🚨 مادەی بەسەرچوو!', {
            body: `${expiredItems.length} مادە بەسەرچووە: ${itemNames}${moreText}`,
            tag: 'expired-items',
          });
        }

        // Expiring soon notification
        if (showExpiryAlerts && expiringItems.length > 0) {
          const itemNames = expiringItems.slice(0, 3).map(i => i.name).join('، ');
          const moreText = expiringItems.length > 3 ? ` و ${expiringItems.length - 3} مادەی تر` : '';
          
          showLocalNotification('⏰ نزیکی بەسەرچوون', {
            body: `${expiringItems.length} مادە نزیکە بەسەربچێت: ${itemNames}${moreText}`,
            tag: 'expiring-items',
          });
        }

        // Low stock notification
        if (showLowStockAlerts && lowStockItems.length > 0) {
          const itemNames = lowStockItems.slice(0, 3).map(i => i.name).join('، ');
          const moreText = lowStockItems.length > 3 ? ` و ${lowStockItems.length - 3} مادەی تر` : '';
          
          showLocalNotification('📦 ستۆک کەمە!', {
            body: `${lowStockItems.length} مادە ستۆکی کەمە: ${itemNames}${moreText}`,
            tag: 'low-stock-items',
          });
        }
      }

      return {
        expired: expiredItems.length,
        expiring: expiringItems.length,
        lowStock: lowStockItems.length
      };

    } catch (error) {
      console.error('Error checking items for notifications:', error);
      return { expired: 0, expiring: 0, lowStock: 0 };
    }
  }, [user, state.permission, showLocalNotification]);

  return {
    ...state,
    requestPermission,
    showLocalNotification,
    checkAndNotify,
  };
}

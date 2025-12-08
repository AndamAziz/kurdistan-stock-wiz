import { useState, useEffect, useCallback } from 'react';

export type NotificationInterval = 'off' | '5min' | '30min' | '1hour' | 'daily';

interface NotificationSettings {
  interval: NotificationInterval;
  expiryAlerts: boolean;
  lowStockAlerts: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  interval: '1hour',
  expiryAlerts: true,
  lowStockAlerts: true,
};

const STORAGE_KEY = 'notification-settings';

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getIntervalMs = useCallback(() => {
    switch (settings.interval) {
      case '5min': return 5 * 60 * 1000;
      case '30min': return 30 * 60 * 1000;
      case '1hour': return 60 * 60 * 1000;
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'off': return null;
      default: return 60 * 60 * 1000;
    }
  }, [settings.interval]);

  return {
    settings,
    updateSettings,
    getIntervalMs,
  };
}

export const intervalOptions = [
  { value: 'off', label: 'ناچالاک' },
  { value: '5min', label: 'هەر ٥ خولەک' },
  { value: '30min', label: 'هەر ٣٠ خولەک' },
  { value: '1hour', label: 'هەر ١ کاتژمێر' },
  { value: 'daily', label: 'ڕۆژانە' },
] as const;

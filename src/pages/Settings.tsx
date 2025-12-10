import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Database, 
  Moon, 
  Sun, 
  Monitor,
  Download,
  Wifi,
  WifiOff,
  Smartphone,
  BellRing,
  BellOff,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import { usePWA } from "@/hooks/usePWA";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useNotificationSettings, intervalOptions, NotificationInterval } from "@/hooks/useNotificationSettings";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/haptics";

export default function Settings() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { isInstallable, isInstalled, isOnline, installApp } = usePWA();
  const { permission, isSupported, requestPermission, checkAndNotify } = usePushNotifications();
  const { settings, updateSettings } = useNotificationSettings();

  const handleSave = () => {
    hapticFeedback.success();
    toast.success('ڕێکخستنەکان پاشەکەوتکران');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    hapticFeedback.selection();
    setTheme(newTheme);
  };

  const handleInstall = async () => {
    hapticFeedback.medium();
    const installed = await installApp();
    if (installed) {
      toast.success('ئەپەکە دامەزرا!');
    }
  };

  const themeOptions = [
    { value: 'light', label: 'ڕووناک', icon: Sun },
    { value: 'dark', label: 'تاریک', icon: Moon },
    { value: 'system', label: 'سیستەم', icon: Monitor },
  ] as const;

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-4xl">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="rounded-lg sm:rounded-xl bg-primary/10 p-2 sm:p-3">
              <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">ڕێکخستنەکان</h1>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">
                ڕێکخستنی سیستەم و بەکارهێنەر
              </p>
            </div>
          </div>
        </div>

        {/* App Status Card */}
        <div className="rounded-lg sm:rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card animate-slide-up">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="rounded-md sm:rounded-lg bg-primary/10 p-1.5 sm:p-2">
              <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-card-foreground">ئەپلیکەیشن</h2>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {/* Online Status */}
            <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 sm:gap-3">
                {isOnline ? (
                  <Wifi className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                ) : (
                  <WifiOff className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                )}
                <div>
                  <p className="text-xs sm:text-sm font-medium">{isOnline ? 'ئۆنلاین' : 'ئۆفلاین'}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {isOnline ? 'پەیوەندی هەیە' : 'پەیوەندی نییە - کاردەکات بە کاشی'}
                  </p>
                </div>
              </div>
              <div className={cn(
                "h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full animate-pulse",
                isOnline ? "bg-success" : "bg-destructive"
              )} />
            </div>

            {/* Install Instructions */}
            <div className="p-3 sm:p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <Download className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm sm:text-base font-semibold text-blue-800 dark:text-blue-200">چۆن ئەپەکە دابەزێنم؟</p>
              </div>
              <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 space-y-2">
                <div className="flex items-start gap-2 p-2 rounded-md bg-blue-100/50 dark:bg-blue-900/30">
                  <span className="text-lg">📱</span>
                  <div>
                    <p className="font-medium">iPhone:</p>
                    <p className="text-blue-600 dark:text-blue-400">Share → Add to Home Screen</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-md bg-blue-100/50 dark:bg-blue-900/30">
                  <span className="text-lg">🤖</span>
                  <div>
                    <p className="font-medium">Android:</p>
                    <p className="text-blue-600 dark:text-blue-400">منیوی براوزەر → Install App / Add to Home Screen</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-md bg-blue-100/50 dark:bg-blue-900/30">
                  <span className="text-lg">💻</span>
                  <div>
                    <p className="font-medium">Laptop / Desktop:</p>
                    <p className="text-blue-600 dark:text-blue-400">لە براوزەر ئایکۆنی دامەزراندن لە کۆتایی ناونیشان</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Install App */}
            {isInstallable && !isInstalled && (
              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Download className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium">دامەزراندنی ئەپ</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">ئەپەکە دابەزێنە سەر ئامێرەکەت</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={handleInstall}
                  className="h-7 sm:h-8 text-[10px] sm:text-xs gap-1"
                >
                  <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  دامەزراندن
                </Button>
              </div>
            )}

            {isInstalled && (
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-success/10 border border-success/20">
                <Download className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-success">ئەپ دامەزراوە</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">ئەپەکە لەسەر ئامێرەکەت دامەزراوە</p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Theme Settings */}
        <div className="rounded-lg sm:rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="rounded-md sm:rounded-lg bg-accent/10 p-1.5 sm:p-2">
              {resolvedTheme === 'dark' ? (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              ) : (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              )}
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-card-foreground">ڕووکار</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200 active:scale-95",
                    isActive 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 sm:h-6 sm:w-6",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-[10px] sm:text-xs font-medium",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notification Settings - Section 1: Activation & Check */}
        <div className="rounded-lg sm:rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card animate-slide-up" style={{ animationDelay: '75ms' }}>
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="rounded-md sm:rounded-lg bg-warning/10 p-1.5 sm:p-2">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-card-foreground">ئاگادارکردنەوەکان</h2>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {/* Push Notification Permission */}
            {isSupported && (
              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 sm:gap-3">
                  {permission === 'granted' ? (
                    <BellRing className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                  ) : (
                    <BellOff className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-xs sm:text-sm font-medium">
                      {permission === 'granted' ? 'ئاگادارکردنەوە چالاکە' : 'ئاگادارکردنەوەی پوش'}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {permission === 'granted' 
                        ? 'ئاگادارکردنەوەکان وەردەگریت'
                        : 'چالاککردن بۆ وەرگرتنی ئاگادارکردنەوە'}
                    </p>
                  </div>
                </div>
                {permission === 'granted' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      hapticFeedback.medium();
                      checkAndNotify();
                      toast.success('ئاگادارکردنەوەکان پشکنران');
                    }}
                    className="h-7 sm:h-8 text-[10px] sm:text-xs"
                  >
                    پشکنین
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={async () => {
                      hapticFeedback.medium();
                      const granted = await requestPermission();
                      if (granted) {
                        toast.success('ئاگادارکردنەوەکان چالاک کران');
                      } else {
                        toast.error('ڕێگەپێدان نەدرا');
                      }
                    }}
                    className="h-7 sm:h-8 text-[10px] sm:text-xs gap-1"
                  >
                    <BellRing className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    چالاککردن
                  </Button>
                )}
              </div>
            )}

            {/* Auto Check Interval */}
            <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 sm:gap-3">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <div>
                  <p className="text-xs sm:text-sm font-medium">پشکنینی خۆکار</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">ماوەی پشکنینی خۆکاری ئاگادارکردنەوەکان</p>
                </div>
              </div>
              <Select
                value={settings.interval}
                onValueChange={(value: NotificationInterval) => {
                  hapticFeedback.selection();
                  updateSettings({ interval: value });
                }}
              >
                <SelectTrigger className="w-[120px] sm:w-[140px] h-8 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {intervalOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Notification Settings - Section 2: Expiry & Low Stock Alerts */}
        <div className="rounded-lg sm:rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="rounded-md sm:rounded-lg bg-destructive/10 p-1.5 sm:p-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-card-foreground">ئاگادارکردنەوەی بەسەرچوون و ستۆک</h2>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-xs sm:text-sm font-medium">ئاگادار لە بەسەرچوون</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">ئاگادارکردنەوە پێش بەسەرچوونی مادە</p>
              </div>
              <Switch 
                checked={settings.expiryAlerts}
                onCheckedChange={(checked) => {
                  hapticFeedback.selection();
                  updateSettings({ expiryAlerts: checked });
                }}
              />
            </div>
            
            <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-xs sm:text-sm font-medium">ئاگادار لە کەم ستۆک</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">کاتێک ستۆک کەمتر دەبێت لە حەدی کەم</p>
              </div>
              <Switch 
                checked={settings.lowStockAlerts}
                onCheckedChange={(checked) => {
                  hapticFeedback.selection();
                  updateSettings({ lowStockAlerts: checked });
                }}
              />
            </div>
            
            {/* Reminder Days Setting */}
            <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 sm:gap-3">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                <div>
                  <p className="text-xs sm:text-sm font-medium">ڕۆژی بیرخستنەوە (پێش بەسەرچوون)</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">چەند ڕۆژ پێش بەسەرچوون ئاگادار بکرێتەوە</p>
                </div>
              </div>
              <Input
                type="number"
                min={1}
                max={365}
                value={settings.reminderDays}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 1 && value <= 365) {
                    hapticFeedback.selection();
                    updateSettings({ reminderDays: value });
                  }
                }}
                className="w-[80px] sm:w-[100px] h-8 text-xs sm:text-sm text-center"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium">ڕاپۆرتی ڕۆژانە</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">ناردنی ڕاپۆرتی کۆتایی ڕۆژ بە ئیمەیڵ</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="rounded-lg sm:rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card animate-slide-up" style={{ animationDelay: '125ms' }}>
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="rounded-md sm:rounded-lg bg-success/10 p-1.5 sm:p-2">
              <Database className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-card-foreground">سیستەم</h2>
          </div>
          
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">ڕۆژی بیرخستنەوە (پێش بەسەرچوون)</Label>
              <Input type="number" defaultValue="30" className="h-9 sm:h-10 text-sm" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">زمان</Label>
              <Input defaultValue="کوردی" disabled className="h-9 sm:h-10 text-sm" />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pb-4">
          <Button onClick={handleSave} size="lg" className="gap-2 h-10 sm:h-11 text-sm sm:text-base">
            <SettingsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            پاشەکەوتکردن
          </Button>
        </div>
      </div>
    </Layout>
  );
}

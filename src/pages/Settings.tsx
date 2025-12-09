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
  User, 
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
  FileText,
  Upload,
  Palette,
  X,
  Share2,
  Copy,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import { usePWA } from "@/hooks/usePWA";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useNotificationSettings, intervalOptions, reminderDaysOptions, NotificationInterval } from "@/hooks/useNotificationSettings";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/haptics";
import { supabase } from "@/integrations/supabase/client";

// Invoice settings stored in localStorage
export interface InvoiceSettings {
  logoUrl: string;
  companyName: string;
  colorTheme: 'blue' | 'green' | 'red' | 'purple' | 'black';
}

const defaultInvoiceSettings: InvoiceSettings = {
  logoUrl: '',
  companyName: 'باکوری خۆشەویست',
  colorTheme: 'blue'
};

export const colorThemes = {
  blue: { primary: '#1e40af', secondary: '#3b82f6', light: '#dbeafe', name: 'شین' },
  green: { primary: '#166534', secondary: '#22c55e', light: '#dcfce7', name: 'سەوز' },
  red: { primary: '#991b1b', secondary: '#ef4444', light: '#fee2e2', name: 'سوور' },
  purple: { primary: '#6b21a8', secondary: '#a855f7', light: '#f3e8ff', name: 'مۆر' },
  black: { primary: '#1a1a1a', secondary: '#404040', light: '#f5f5f5', name: 'ڕەش' },
};

export function useInvoiceSettings() {
  const [settings, setSettings] = useState<InvoiceSettings>(() => {
    const saved = localStorage.getItem('invoice-settings');
    return saved ? JSON.parse(saved) : defaultInvoiceSettings;
  });

  const updateSettings = (newSettings: Partial<InvoiceSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('invoice-settings', JSON.stringify(updated));
  };

  return { settings, updateSettings };
}

export default function Settings() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { isInstallable, isInstalled, isOnline, installApp } = usePWA();
  const { permission, isSupported, requestPermission, checkAndNotify } = usePushNotifications();
  const { settings, updateSettings } = useNotificationSettings();
  const { settings: invoiceSettings, updateSettings: updateInvoiceSettings } = useInvoiceSettings();
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleSave = () => {
    hapticFeedback.success();
    toast.success('ڕێکخستنەکان پاشەکەوتکران');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('تکایە وێنەیەک هەڵبژێرە');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('قەبارەی وێنە دەبێت کەمتر بێت لە 2MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath);

      updateInvoiceSettings({ logoUrl: publicUrl });
      toast.success('لۆگۆ بەسەرکەوتوویی ئەپڵۆد کرا');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('هەڵە لە ئەپڵۆدکردنی لۆگۆ');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    updateInvoiceSettings({ logoUrl: '' });
    toast.success('لۆگۆ لابرا');
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

            {/* Share App Link */}
            <div className="p-2 sm:p-3 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <div>
                  <p className="text-xs sm:text-sm font-medium">دابەزاندنی ئەپ</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">لینکی ئەپ بنێرە بۆ مۆبایل یان لاپتۆپ</p>
                </div>
              </div>
              
              {/* App Link Display */}
              <div className="flex items-center gap-2 p-2 rounded-md bg-background border border-border">
                <a 
                  href={window.location.origin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-xs sm:text-sm text-primary font-mono truncate hover:underline"
                  dir="ltr"
                >
                  {window.location.origin}
                </a>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin);
                    hapticFeedback.success();
                    toast.success("لینک کۆپی کرا!");
                  }}
                  className="h-7 px-2"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Share Buttons */}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin);
                    hapticFeedback.success();
                    toast.success("لینک کۆپی کرا!");
                  }}
                  className="flex-1 h-8 text-xs gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  کۆپی کردنی لینک
                </Button>
                {navigator.share && (
                  <Button 
                    size="sm" 
                    onClick={() => {
                      hapticFeedback.light();
                      navigator.share({
                        title: 'ئەپی کۆگا',
                        text: 'ئەپی بەڕێوەبردنی کۆگا دابەزێنە',
                        url: window.location.origin
                      });
                    }}
                    className="flex-1 h-8 text-xs gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    بەشکردن
                  </Button>
                )}
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

            {/* Install Instructions */}
            <div className="p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <p className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200 mb-1.5">چۆن ئەپەکە دابەزێنم؟</p>
              <div className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p><strong>iPhone:</strong> Share → Add to Home Screen</p>
                <p><strong>Android:</strong> منیوی براوزەر → Install App</p>
                <p><strong>Laptop:</strong> لە براوزەر ئایکۆنی دامەزراندن</p>
              </div>
            </div>
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

        {/* Invoice Settings */}
        <div className="rounded-lg sm:rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card animate-slide-up" style={{ animationDelay: '75ms' }}>
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="rounded-md sm:rounded-lg bg-blue-500/10 p-1.5 sm:p-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-card-foreground">ڕێکخستنی پسولە</h2>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            {/* Logo Upload */}
            <div className="space-y-3">
              <Label className="text-xs sm:text-sm font-medium">لۆگۆی کۆمپانیا</Label>
              <div className="flex items-center gap-4">
                {invoiceSettings.logoUrl ? (
                  <div className="relative">
                    <div className="h-20 w-20 rounded-lg border border-border overflow-hidden bg-white">
                      <img 
                        src={invoiceSettings.logoUrl} 
                        alt="Company Logo"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                    <div className={cn(
                      "flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors",
                      uploadingLogo && "opacity-50 cursor-not-allowed"
                    )}>
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">{uploadingLogo ? 'ئەپڵۆدکردن...' : 'هەڵبژاردنی لۆگۆ'}</span>
                    </div>
                  </label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                    فۆرمات: PNG, JPG • قەبارە: کەمتر لە 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">ناوی کۆمپانیا</Label>
              <Input 
                value={invoiceSettings.companyName}
                onChange={(e) => updateInvoiceSettings({ companyName: e.target.value })}
                placeholder="ناوی کۆمپانیا بۆ پسولە"
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            {/* Color Theme */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs sm:text-sm font-medium">ڕەنگی پسولە</Label>
              </div>
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {Object.entries(colorThemes).map(([key, theme]) => {
                  const isActive = invoiceSettings.colorTheme === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        hapticFeedback.selection();
                        updateInvoiceSettings({ colorTheme: key as InvoiceSettings['colorTheme'] });
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 active:scale-95",
                        isActive 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div 
                        className="h-8 w-8 rounded-full shadow-sm"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <span className={cn(
                        "text-[10px] sm:text-xs font-medium",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}>
                        {theme.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg border border-border bg-white">
              <p className="text-xs text-muted-foreground mb-3">پێشبینینی پسولە:</p>
              <div 
                className="p-4 rounded-lg text-white text-center"
                style={{ backgroundColor: colorThemes[invoiceSettings.colorTheme].primary }}
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  {invoiceSettings.logoUrl && (
                    <img src={invoiceSettings.logoUrl} alt="Logo" className="h-10 w-10 rounded object-contain bg-white p-1" />
                  )}
                  <span className="font-bold text-lg">{invoiceSettings.companyName}</span>
                </div>
                <p className="text-xs opacity-80">پسولەی دەرچوون لە کۆگا</p>
              </div>
            </div>
          </div>
        </div>


        {/* Notification Settings - Section 1: Activation & Check */}
        <div className="rounded-lg sm:rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card animate-slide-up" style={{ animationDelay: '150ms' }}>
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
        <div className="rounded-lg sm:rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card animate-slide-up" style={{ animationDelay: '175ms' }}>
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
                  <p className="text-xs sm:text-sm font-medium">ڕۆژی بیرخستنەوە</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">چەند ڕۆژ پێش بەسەرچوون ئاگادار بکرێتەوە</p>
                </div>
              </div>
              <Select
                value={settings.reminderDays.toString()}
                onValueChange={(value) => {
                  hapticFeedback.selection();
                  updateSettings({ reminderDays: parseInt(value) });
                }}
              >
                <SelectTrigger className="w-[100px] sm:w-[120px] h-8 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reminderDaysOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        <div className="rounded-lg sm:rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card animate-slide-up" style={{ animationDelay: '200ms' }}>
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

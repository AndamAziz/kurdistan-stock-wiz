import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Bell, Shield, Database, User } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const handleSave = () => {
    toast.success('ڕێکخستنەکان پاشەکەوتکران');
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <SettingsIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">ڕێکخستنەکان</h1>
              <p className="mt-1 text-muted-foreground">
                ڕێکخستنی سیستەم و بەکارهێنەر
              </p>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-primary/10 p-2">
              <User className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-card-foreground">زانیاری بەکارهێنەر</h2>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>ناو</Label>
              <Input defaultValue="باکوری" />
            </div>
            <div className="space-y-2">
              <Label>ناوی بەکارهێنەر</Label>
              <Input defaultValue="admin" />
            </div>
            <div className="space-y-2">
              <Label>ئیمەیڵ</Label>
              <Input type="email" defaultValue="admin@bakuri.com" />
            </div>
            <div className="space-y-2">
              <Label>ژمارەی مۆبایل</Label>
              <Input defaultValue="0750 123 4567" />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-accent/10 p-2">
              <Bell className="h-5 w-5 text-accent" />
            </div>
            <h2 className="text-lg font-semibold text-card-foreground">ئاگادارکردنەوەکان</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">ئاگادار لە بەسەرچوون</p>
                <p className="text-sm text-muted-foreground">ئاگادارکردنەوە پێش بەسەرچوونی مادە</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">ئاگادار لە کەم ستۆک</p>
                <p className="text-sm text-muted-foreground">کاتێک ستۆک کەمتر دەبێت لە حەدی کەم</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">ڕاپۆرتی ڕۆژانە</p>
                <p className="text-sm text-muted-foreground">ناردنی ڕاپۆرتی کۆتایی ڕۆژ بە ئیمەیڵ</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-success/10 p-2">
              <Database className="h-5 w-5 text-success" />
            </div>
            <h2 className="text-lg font-semibold text-card-foreground">سیستەم</h2>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>ڕۆژی بیرخستنەوە (پێش بەسەرچوون)</Label>
              <Input type="number" defaultValue="30" />
            </div>
            <div className="space-y-2">
              <Label>زمان</Label>
              <Input defaultValue="کوردی" disabled />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg" className="gap-2">
            <SettingsIcon className="h-5 w-5" />
            پاشەکەوتکردن
          </Button>
        </div>
      </div>
    </Layout>
  );
}

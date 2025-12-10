import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, Loader2, ShieldCheck, Phone } from 'lucide-react';
import bakuryLogo from '@/assets/bakury-logo-new.jpg';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

const emailLoginSchema = z.object({
  email: z.string().email('ئیمەیڵ نادروستە'),
  password: z.string().min(6, 'وشەی نهێنی دەبێت لانیکەم ٦ پیت بێت'),
});

const phoneLoginSchema = z.object({
  phone: z.string().min(10, 'ژمارەی مۆبایل دەبێت لانیکەم ١٠ پیت بێت'),
  password: z.string().min(6, 'وشەی نهێنی دەبێت لانیکەم ٦ پیت بێت'),
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = emailLoginSchema.safeParse({ email, password });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('ئیمەیڵ یان وشەی نهێنی هەڵەیە');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('بەخێربێیتەوە!');
        navigate('/');
      }
    } catch (err) {
      toast.error('هەڵەیەک ڕوویدا');
    } finally {
      setLoading(false);
    }
  };

  // Format phone number to E.164 format for Supabase
  const formatPhoneNumber = (phoneInput: string): string => {
    // Remove all non-digit characters
    let digits = phoneInput.replace(/\D/g, '');
    
    // Handle Iraqi phone numbers
    if (digits.startsWith('964')) {
      return '+' + digits;
    } else if (digits.startsWith('07')) {
      // Convert 07XX to +9647XX
      return '+964' + digits.substring(1);
    } else if (digits.startsWith('7') && digits.length >= 10) {
      // Convert 7XX to +9647XX
      return '+964' + digits;
    }
    
    // If already has country code or unknown format, add + if missing
    return digits.startsWith('+') ? digits : '+' + digits;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = phoneLoginSchema.safeParse({ phone, password });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      // Format phone to E.164 format
      const formattedPhone = formatPhoneNumber(phone);

      const { error } = await supabase.auth.signInWithPassword({ 
        phone: formattedPhone, 
        password 
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('ژمارەی مۆبایل یان وشەی نهێنی هەڵەیە');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('بەخێربێیتەوە!');
        navigate('/');
      }
    } catch (err) {
      toast.error('هەڵەیەک ڕوویدا');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          <div className="relative inline-block">
            {/* Outer decorative glow */}
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 rounded-2xl blur-xl"></div>
            {/* Logo container - clean white background */}
            <div className="relative bg-white rounded-2xl shadow-xl shadow-primary/15 p-2">
              <img 
                src={bakuryLogo} 
                alt="باکوری خۆشەویست" 
                className="w-28 h-28 sm:w-32 sm:h-32 object-contain"
              />
            </div>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground mt-4">
            سیستمی بەڕێوەبردنی کۆگا
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-border/50 bg-card/95 backdrop-blur-sm p-6 sm:p-8 shadow-xl shadow-black/5 animate-slide-up">
          <div className="flex items-center justify-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              چوونەژوورەوە
            </h2>
          </div>

          <Tabs value={loginType} onValueChange={(v) => setLoginType(v as 'email' | 'phone')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email" className="gap-2">
                <Mail className="h-4 w-4" />
                ئیمەیڵ
              </TabsTrigger>
              <TabsTrigger value="phone" className="gap-2">
                <Phone className="h-4 w-4" />
                مەندوب
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <form onSubmit={handleEmailSubmit} className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    ئیمەیڵ
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="pr-10 sm:pr-11 h-10 sm:h-11 text-sm sm:text-base transition-all focus:ring-2 focus:ring-primary/20"
                      dir="ltr"
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-email" className="text-sm font-medium">
                    وشەی نهێنی
                  </Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password-email"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10 sm:pr-11 h-10 sm:h-11 text-sm sm:text-base transition-all focus:ring-2 focus:ring-primary/20"
                      dir="ltr"
                      disabled={loading}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium gap-2 mt-2 transition-all hover:shadow-lg hover:shadow-primary/25" 
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  چوونەژوورەوە
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone">
              <form onSubmit={handlePhoneSubmit} className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    ژمارەی مۆبایل
                  </Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07XXXXXXXXX"
                      className="pr-10 sm:pr-11 h-10 sm:h-11 text-sm sm:text-base transition-all focus:ring-2 focus:ring-primary/20"
                      dir="ltr"
                      disabled={loading}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-phone" className="text-sm font-medium">
                    وشەی نهێنی
                  </Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password-phone"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10 sm:pr-11 h-10 sm:h-11 text-sm sm:text-base transition-all focus:ring-2 focus:ring-primary/20"
                      dir="ltr"
                      disabled={loading}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium gap-2 mt-2 transition-all hover:shadow-lg hover:shadow-primary/25" 
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  چوونەژوورەوە
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Info Notice */}
          <div className="mt-6 pt-5 border-t border-border/50">
            <p className="text-xs sm:text-sm text-muted-foreground text-center leading-relaxed">
              تەنها ئەدمین دەتوانێت بەکارهێنەری نوێ زیاد بکات.
              <br className="hidden sm:block" />
              <span className="text-foreground/70">پەیوەندی بکە بە بەڕێوەبەرەوە.</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/70 mt-6 sm:mt-8">
          © {new Date().getFullYear()} باکوری خۆشەویست
        </p>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, Loader2, ShieldCheck } from 'lucide-react';
import bakuryLogo from '@/assets/bakury-logo-new.jpg';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('ئیمەیڵ نادروستە'),
  password: z.string().min(6, 'وشەی نهێنی دەبێت لانیکەم ٦ پیت بێت'),
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = loginSchema.safeParse({ email, password });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      const { error } = await signIn(email, password);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          <div className="relative inline-block">
            {/* Outer decorative glow */}
            <div className="absolute -inset-6 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 rounded-[3rem] blur-2xl"></div>
            {/* Logo container - clean white background */}
            <div className="relative bg-white rounded-3xl shadow-2xl shadow-primary/20 p-2">
              <img 
                src={bakuryLogo} 
                alt="باکوری خۆشەویست" 
                className="w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 object-contain"
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

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
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
              <Label htmlFor="password" className="text-sm font-medium">
                وشەی نهێنی
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
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

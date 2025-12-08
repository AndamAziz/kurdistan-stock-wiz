import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  AlertTriangle,
  Settings,
  FileSpreadsheet,
  Tags,
  Building2,
  LogOut,
  Users,
  Menu,
} from "lucide-react";

const navigation = [
  { name: 'داشبۆرد', href: '/', icon: LayoutDashboard },
  { name: 'مادەکان', href: '/items', icon: Package },
  { name: 'داخڵکردن', href: '/stock-in', icon: ArrowDownToLine },
  { name: 'دەرکردن', href: '/stock-out', icon: ArrowUpFromLine },
  { name: 'ڕاستکردنەوە', href: '/stock-adjust', icon: RefreshCw },
  { name: 'بەسەرچوون', href: '/expiry', icon: AlertTriangle },
  { name: 'ئیمپۆرت/ئێکسپۆرت', href: '/import-export', icon: FileSpreadsheet },
];

const settingsNavigation = [
  { name: 'هاوپۆلەکان', href: '/categories', icon: Tags },
  { name: 'براندەکان', href: '/brands', icon: Building2 },
  { name: 'ڕێکخستنەکان', href: '/settings', icon: Settings },
];

const adminNavigation = [
  { name: 'بەکارهێنەران', href: '/user-roles', icon: Users },
];

interface SidebarProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRoles();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex h-full flex-col bg-gradient-sidebar">
      {/* Logo */}
      <div className="flex h-16 lg:h-20 items-center justify-center border-b border-sidebar-border/50 px-4 lg:px-6">
        <div className="text-center">
          <h1 className="text-lg lg:text-xl font-bold text-sidebar-foreground tracking-tight">
            باکوری خۆشەویست
          </h1>
          <p className="text-[10px] lg:text-xs text-sidebar-foreground/50 mt-0.5">
            سیستمی بەڕێوەبردنی کۆگا
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 lg:px-3 py-4 lg:py-5 overflow-y-auto">
        <div className="mb-3 px-3 text-[10px] lg:text-xs font-bold uppercase tracking-widest text-sidebar-foreground/30">
          سەرەکی
        </div>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onNavClick}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 lg:py-3 text-sm font-medium transition-all duration-200",
              "text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"
            )}
            activeClassName="bg-gradient-to-r from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/30"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-accent/30 group-[.active]:bg-white/10 transition-all duration-200">
              <item.icon className="h-4 w-4 lg:h-[18px] lg:w-[18px]" strokeWidth={2} />
            </div>
            <span>{item.name}</span>
          </NavLink>
        ))}

        <div className="mb-3 mt-6 px-3 text-[10px] lg:text-xs font-bold uppercase tracking-widest text-sidebar-foreground/30">
          ڕێکخستن
        </div>
        {settingsNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onNavClick}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 lg:py-3 text-sm font-medium transition-all duration-200",
              "text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"
            )}
            activeClassName="bg-gradient-to-r from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/30"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-accent/30 group-[.active]:bg-white/10 transition-all duration-200">
              <item.icon className="h-4 w-4 lg:h-[18px] lg:w-[18px]" strokeWidth={2} />
            </div>
            <span>{item.name}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="mb-3 mt-6 px-3 text-[10px] lg:text-xs font-bold uppercase tracking-widest text-sidebar-foreground/30">
              بەڕێوەبەر
            </div>
            {adminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onNavClick}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 lg:py-3 text-sm font-medium transition-all duration-200",
                  "text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"
                )}
                activeClassName="bg-gradient-to-r from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/30"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-accent/30 group-[.active]:bg-white/10 transition-all duration-200">
                  <item.icon className="h-4 w-4 lg:h-[18px] lg:w-[18px]" strokeWidth={2} />
                </div>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border/50 p-3 lg:p-4">
        <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-sidebar-accent/30">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 text-sidebar-primary-foreground shadow-md shrink-0">
              <span className="text-sm font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'ب'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {user?.user_metadata?.full_name || 'بەکارهێنەر'}
              </p>
              <p className="text-[11px] text-sidebar-foreground/50 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 h-9 w-9 rounded-lg shrink-0 transition-colors duration-200"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ isOpen = false, onOpenChange }: SidebarProps) {
  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 right-0 left-0 z-50 h-14 bg-gradient-sidebar border-b border-sidebar-border/50 flex items-center justify-between px-4 shadow-lg">
        <h1 className="text-base font-bold text-sidebar-foreground tracking-tight">
          باکوری خۆشەویست
        </h1>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-xl h-10 w-10"
          onClick={() => onOpenChange?.(!isOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile Sheet */}
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-72 p-0 border-l border-sidebar-border/50">
          <SidebarContent onNavClick={() => onOpenChange?.(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed right-0 top-0 z-40 h-screen w-60 xl:w-64 shadow-2xl">
        <SidebarContent />
      </aside>
    </>
  );
}

export function MobileMenuButton() {
  return null;
}
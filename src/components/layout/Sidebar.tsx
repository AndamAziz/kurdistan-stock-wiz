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
      <div className="flex h-16 lg:h-20 items-center justify-center border-b border-sidebar-border px-4 lg:px-6">
        <div className="text-center">
          <h1 className="text-lg lg:text-xl font-bold text-sidebar-foreground">
            باکوری خۆشەویست
          </h1>
          <p className="text-[10px] lg:text-xs text-sidebar-foreground/60">
            سیستمی بەڕێوەبردنی کۆگا
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 lg:px-3 py-3 lg:py-4 overflow-y-auto">
        <div className="mb-2 px-3 text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          سەرەکی
        </div>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onNavClick}
            className={cn(
              "group flex items-center gap-2 lg:gap-3 rounded-lg px-3 py-2 lg:py-2.5 text-xs lg:text-sm font-medium transition-all duration-200",
              "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
            activeClassName="bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
          >
            <item.icon className="h-4 w-4 lg:h-5 lg:w-5 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}

        <div className="mb-2 mt-4 lg:mt-6 px-3 text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          ڕێکخستن
        </div>
        {settingsNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onNavClick}
            className={cn(
              "group flex items-center gap-2 lg:gap-3 rounded-lg px-3 py-2 lg:py-2.5 text-xs lg:text-sm font-medium transition-all duration-200",
              "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
            activeClassName="bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
          >
            <item.icon className="h-4 w-4 lg:h-5 lg:w-5 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="mb-2 mt-4 lg:mt-6 px-3 text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              بەڕێوەبەر
            </div>
            {adminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onNavClick}
                className={cn(
                  "group flex items-center gap-2 lg:gap-3 rounded-lg px-3 py-2 lg:py-2.5 text-xs lg:text-sm font-medium transition-all duration-200",
                  "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
                activeClassName="bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
              >
                <item.icon className="h-4 w-4 lg:h-5 lg:w-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 lg:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
            <div className="flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
              <span className="text-xs lg:text-sm font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'ب'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-medium text-sidebar-foreground truncate">
                {user?.user_metadata?.full_name || 'بەکارهێنەر'}
              </p>
              <p className="text-[10px] lg:text-xs text-sidebar-foreground/60 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8 lg:h-9 lg:w-9 shrink-0"
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
      <header className="lg:hidden fixed top-0 right-0 left-0 z-50 h-14 bg-gradient-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
        <h1 className="text-base font-bold text-sidebar-foreground">
          باکوری خۆشەویست
        </h1>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-sidebar-foreground"
          onClick={() => onOpenChange?.(!isOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile Sheet */}
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-64 p-0 border-l border-sidebar-border">
          <SidebarContent onNavClick={() => onOpenChange?.(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed right-0 top-0 z-40 h-screen w-60 xl:w-64 shadow-sidebar">
        <SidebarContent />
      </aside>
    </>
  );
}

export function MobileMenuButton() {
  return null;
}

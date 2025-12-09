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
  FileText,
} from "lucide-react";

const navigation = [
  { name: 'داشبۆرد', href: '/', icon: LayoutDashboard },
  { name: 'مادەکان', href: '/items', icon: Package },
  { name: 'داخڵکردن', href: '/stock-in', icon: ArrowDownToLine },
  { name: 'دەرکردن', href: '/stock-out', icon: ArrowUpFromLine },
  { name: 'ڕاستکردنەوە', href: '/stock-adjust', icon: RefreshCw },
  { name: 'بەسەرچوون', href: '/expiry', icon: AlertTriangle },
  { name: 'ئینڤۆیسەکان', href: '/invoices', icon: FileText },
  { name: 'ئیمپۆرت/ئێکسپۆرت', href: '/import-export', icon: FileSpreadsheet },
];

const settingsNavigation = [
  { name: 'کەتەگۆریەکان', href: '/categories', icon: Tags },
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
      <div className="flex h-14 lg:h-20 items-center justify-center border-b border-sidebar-border/50 px-3 lg:px-5">
        <div className="text-center">
          <h1 className="text-base lg:text-xl font-bold text-sidebar-foreground tracking-tight">
            باکوری خۆشەویست
          </h1>
          <p className="text-[9px] lg:text-xs text-sidebar-foreground/50 mt-0.5">
            سیستمی بەڕێوەبردنی کۆگا
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 lg:px-3 py-2 lg:py-4 overflow-y-auto">
        <div className="mb-2 px-3 text-[9px] lg:text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
          سەرەکی
        </div>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onNavClick}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 lg:py-3 text-sm lg:text-base font-medium transition-all duration-200 mb-1",
              "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
            activeClassName="bg-gradient-to-r from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground shadow-md"
          >
            <item.icon className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={2} />
            <span>{item.name}</span>
          </NavLink>
        ))}

        <div className="mb-2 mt-4 px-3 text-[9px] lg:text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
          ڕێکخستن
        </div>
        {settingsNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onNavClick}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 lg:py-3 text-sm lg:text-base font-medium transition-all duration-200 mb-1",
              "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
            activeClassName="bg-gradient-to-r from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground shadow-md"
          >
            <item.icon className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={2} />
            <span>{item.name}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="mb-2 mt-4 px-3 text-[9px] lg:text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
              بەڕێوەبەر
            </div>
            {adminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onNavClick}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 lg:py-3 text-sm lg:text-base font-medium transition-all duration-200 mb-1",
                  "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
                activeClassName="bg-gradient-to-r from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground shadow-md"
              >
                <item.icon className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={2} />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border/50 p-4 lg:p-5">
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-sidebar-accent/30">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-11 w-11 lg:h-12 lg:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 text-sidebar-primary-foreground shadow-md shrink-0">
              <span className="text-base lg:text-lg font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'ب'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm lg:text-base font-semibold text-sidebar-foreground truncate">
                {user?.user_metadata?.full_name || 'بەکارهێنەر'}
              </p>
              <p className="text-xs lg:text-sm text-sidebar-foreground/50 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 h-10 w-10 rounded-lg shrink-0 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
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
      <aside className="hidden lg:block fixed right-0 top-0 z-40 h-screen w-64 xl:w-72 2xl:w-80 shadow-2xl">
        <SidebarContent />
      </aside>
    </>
  );
}

export function MobileMenuButton() {
  return null;
}
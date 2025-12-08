import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Settings,
  FileSpreadsheet,
  Tags,
  Building2,
  LogOut,
  Users,
} from "lucide-react";

const navigation = [
  { name: 'داشبۆرد', href: '/', icon: LayoutDashboard },
  { name: 'مادەکان', href: '/items', icon: Package },
  { name: 'داخڵکردن', href: '/stock-in', icon: ArrowDownToLine },
  { name: 'دەرکردن', href: '/stock-out', icon: ArrowUpFromLine },
  { name: 'بەسەرچوون', href: '/expiry', icon: AlertTriangle },
  { name: 'ئیمپۆرت/ئێکسپۆرت', href: '/import-export', icon: FileSpreadsheet },
];

const settingsNavigation = [
  { name: 'هاوپۆلەکان', href: '/categories', icon: Tags },
  { name: 'براندەکان', href: '/brands', icon: Building2 },
  { name: 'بەکارهێنەران', href: '/user-roles', icon: Users },
  { name: 'ڕێکخستنەکان', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-64 bg-gradient-sidebar shadow-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center justify-center border-b border-sidebar-border px-6">
          <div className="text-center">
            <h1 className="text-xl font-bold text-sidebar-foreground">
              باکوری خۆشەویست
            </h1>
            <p className="text-xs text-sidebar-foreground/60">
              سیستمی بەڕێوەبردنی کۆگا
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            سەرەکی
          </div>
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              activeClassName="bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}

          <div className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            ڕێکخستن
          </div>
          {settingsNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              activeClassName="bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="text-sm font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'ب'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.user_metadata?.full_name || 'بەکارهێنەر'}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

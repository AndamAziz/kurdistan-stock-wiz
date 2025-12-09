import { useState } from "react";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
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
  Boxes,
  Wrench,
  Shield,
  ChevronDown,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const mainNavigation = [
  { name: 'داشبۆرد', href: '/', icon: LayoutDashboard },
  { name: 'مادەکان', href: '/items', icon: Package },
];

const stockNavigation = [
  { name: 'داخڵکردن', href: '/stock-in', icon: ArrowDownToLine },
  { name: 'دەرکردن', href: '/stock-out', icon: ArrowUpFromLine },
  { name: 'ڕاستکردنەوە', href: '/stock-adjust', icon: RefreshCw },
];

const reportNavigation = [
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

export function TopNavigation() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRoles();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNavigate = (href: string) => {
    navigate(href);
    setOpen(false);
  };

  const isActiveRoute = (href: string) => location.pathname === href;
  const isActiveGroup = (items: { href: string }[]) => items.some(item => location.pathname === item.href);

  // Get current page name
  const getCurrentPageName = () => {
    const allItems = [...mainNavigation, ...stockNavigation, ...reportNavigation, ...settingsNavigation, ...adminNavigation];
    const current = allItems.find(item => item.href === location.pathname);
    return current?.name || 'داشبۆرد';
  };

  const getCurrentPageIcon = () => {
    const allItems = [...mainNavigation, ...stockNavigation, ...reportNavigation, ...settingsNavigation, ...adminNavigation];
    const current = allItems.find(item => item.href === location.pathname);
    return current?.icon || LayoutDashboard;
  };

  const CurrentIcon = getCurrentPageIcon();

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-card via-card to-card/95 backdrop-blur-xl border-b-2 border-border/50 shadow-lg">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25">
              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg lg:text-xl font-bold text-foreground">
                باکوری خۆشەویست
              </h1>
              <p className="text-[10px] lg:text-xs text-muted-foreground">
                سیستمی بەڕێوەبردنی کۆگا
              </p>
            </div>
          </div>

          {/* Navigation Dropdown */}
          <div className="flex items-center gap-2 sm:gap-4">
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-11 sm:h-12 px-4 sm:px-6 gap-2 sm:gap-3 text-sm sm:text-base font-semibold border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <CurrentIcon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="hidden xs:inline">{getCurrentPageName()}</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    open && "rotate-180"
                  )} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="center" 
                className="w-72 sm:w-80 p-2 bg-popover/98 backdrop-blur-xl border-2 border-border/50 shadow-2xl rounded-2xl"
                sideOffset={8}
              >
                {/* Main Navigation */}
                <DropdownMenuLabel className="text-xs text-muted-foreground font-bold uppercase tracking-wider px-3 py-2">
                  سەرەکی
                </DropdownMenuLabel>
                {mainNavigation.map((item) => (
                  <DropdownMenuItem
                    key={item.name}
                    onClick={() => handleNavigate(item.href)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 my-1",
                      isActiveRoute(item.href) 
                        ? "bg-primary/15 text-primary font-semibold" 
                        : "hover:bg-accent/50"
                    )}
                  >
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                      isActiveRoute(item.href) 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "bg-muted/50"
                    )}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{item.name}</span>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator className="my-2 bg-border/50" />

                {/* Stock Operations */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer my-1",
                    isActiveGroup(stockNavigation) && "bg-primary/10 text-primary"
                  )}>
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      isActiveGroup(stockNavigation) 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "bg-muted/50"
                    )}>
                      <Boxes className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">جوڵەی ستۆک</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="w-56 p-2 bg-popover/98 backdrop-blur-xl border-2 border-border/50 shadow-xl rounded-xl">
                      {stockNavigation.map((item) => (
                        <DropdownMenuItem
                          key={item.name}
                          onClick={() => handleNavigate(item.href)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer my-0.5",
                            isActiveRoute(item.href) 
                              ? "bg-primary/15 text-primary font-semibold" 
                              : "hover:bg-accent/50"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm">{item.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Reports */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer my-1",
                    isActiveGroup(reportNavigation) && "bg-primary/10 text-primary"
                  )}>
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      isActiveGroup(reportNavigation) 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "bg-muted/50"
                    )}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">ڕاپۆرتەکان</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="w-56 p-2 bg-popover/98 backdrop-blur-xl border-2 border-border/50 shadow-xl rounded-xl">
                      {reportNavigation.map((item) => (
                        <DropdownMenuItem
                          key={item.name}
                          onClick={() => handleNavigate(item.href)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer my-0.5",
                            isActiveRoute(item.href) 
                              ? "bg-primary/15 text-primary font-semibold" 
                              : "hover:bg-accent/50"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm">{item.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Settings */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer my-1",
                    isActiveGroup(settingsNavigation) && "bg-primary/10 text-primary"
                  )}>
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      isActiveGroup(settingsNavigation) 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "bg-muted/50"
                    )}>
                      <Wrench className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">ڕێکخستن</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="w-56 p-2 bg-popover/98 backdrop-blur-xl border-2 border-border/50 shadow-xl rounded-xl">
                      {settingsNavigation.map((item) => (
                        <DropdownMenuItem
                          key={item.name}
                          onClick={() => handleNavigate(item.href)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer my-0.5",
                            isActiveRoute(item.href) 
                              ? "bg-primary/15 text-primary font-semibold" 
                              : "hover:bg-accent/50"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm">{item.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Admin */}
                {isAdmin && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer my-1",
                      isActiveGroup(adminNavigation) && "bg-primary/10 text-primary"
                    )}>
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        isActiveGroup(adminNavigation) 
                          ? "bg-primary text-primary-foreground shadow-md" 
                          : "bg-muted/50"
                      )}>
                        <Shield className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">بەڕێوەبەر</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="w-56 p-2 bg-popover/98 backdrop-blur-xl border-2 border-border/50 shadow-xl rounded-xl">
                        {adminNavigation.map((item) => (
                          <DropdownMenuItem
                            key={item.name}
                            onClick={() => handleNavigate(item.href)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer my-0.5",
                              isActiveRoute(item.href) 
                                ? "bg-primary/15 text-primary font-semibold" 
                                : "hover:bg-accent/50"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            <span className="text-sm">{item.name}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-11 sm:h-12 px-2 sm:px-3 gap-2 hover:bg-accent/50 rounded-xl"
                >
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
                    <span className="text-sm sm:text-base font-bold">
                      {user?.email?.charAt(0).toUpperCase() || 'ب'}
                    </span>
                  </div>
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {user?.user_metadata?.full_name || 'بەکارهێنەر'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {user?.email}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 p-2 bg-popover/98 backdrop-blur-xl border-2 border-border/50 shadow-xl rounded-xl"
              >
                <div className="px-3 py-2 mb-2">
                  <p className="text-sm font-semibold">{user?.user_metadata?.full_name || 'بەکارهێنەر'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">چوونەدەرەوە</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
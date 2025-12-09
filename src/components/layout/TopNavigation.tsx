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
    <header className="sticky top-0 z-50 w-full">
      {/* Gradient Background with Glass Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-background to-accent/5 backdrop-blur-2xl" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background/60" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="relative max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex h-18 sm:h-22 items-center justify-between gap-6 py-3">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
              <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-xl shadow-primary/30 ring-2 ring-primary/20">
                <Package className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                باکوری خۆشەویست
              </h1>
              <p className="text-xs lg:text-sm text-muted-foreground font-medium mt-0.5">
                سیستمی بەڕێوەبردنی کۆگا
              </p>
            </div>
          </div>

          {/* Center Navigation */}
          <div className="flex items-center gap-3 sm:gap-4">
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "h-12 sm:h-14 px-4 sm:px-6 gap-3 text-sm sm:text-base font-semibold",
                    "bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-xl",
                    "border-2 border-border/60 hover:border-primary/50",
                    "shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-primary/10",
                    "transition-all duration-300 rounded-2xl",
                    open && "border-primary/50 shadow-primary/20"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300",
                    "bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20"
                  )}>
                    <CurrentIcon className="h-5 w-5 text-primary" strokeWidth={2} />
                  </div>
                  <span className="hidden sm:inline text-foreground">{getCurrentPageName()}</span>
                  <div className="flex items-center gap-1">
                    <Menu className="h-4 w-4 sm:hidden text-muted-foreground" />
                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-300",
                      open && "rotate-180"
                    )} />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="center" 
                className="w-[calc(100vw-2rem)] sm:w-96 max-w-96 p-2 sm:p-3 bg-popover/98 backdrop-blur-2xl border-2 border-border/40 shadow-2xl shadow-black/20 rounded-2xl sm:rounded-3xl max-h-[80vh] overflow-y-auto"
                sideOffset={8}
              >
                {/* Main Navigation */}
                <div className="mb-2 sm:mb-3">
                  <DropdownMenuLabel className="text-[10px] text-primary font-bold uppercase tracking-widest px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    سەرەکی
                  </DropdownMenuLabel>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    {mainNavigation.map((item) => (
                      <DropdownMenuItem
                        key={item.name}
                        onClick={() => handleNavigate(item.href)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300",
                          isActiveRoute(item.href) 
                            ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary ring-1 sm:ring-2 ring-primary/30" 
                            : "hover:bg-accent/60"
                        )}
                      >
                        <div className={cn(
                          "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-300",
                          isActiveRoute(item.href) 
                            ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30" 
                            : "bg-muted/60"
                        )}>
                          <item.icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold">{item.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </div>

                <DropdownMenuSeparator className="my-3 bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Navigation Groups */}
                <div className="space-y-2">
                  {/* Stock Operations */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className={cn(
                      "flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300",
                      isActiveGroup(stockNavigation) 
                        ? "bg-gradient-to-r from-success/15 to-success/5 text-success ring-1 ring-success/30" 
                        : "hover:bg-accent/50"
                    )}>
                      <div className={cn(
                        "flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-300",
                        isActiveGroup(stockNavigation) 
                          ? "bg-gradient-to-br from-success to-success/80 text-success-foreground shadow-lg shadow-success/25" 
                          : "bg-muted/50"
                      )}>
                        <Boxes className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs sm:text-sm font-semibold block truncate">جوڵەی ستۆک</span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate block">داخڵکردن، دەرکردن، ڕاستکردنەوە</span>
                      </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="w-56 sm:w-64 p-1.5 sm:p-2 bg-popover/98 backdrop-blur-2xl border-2 border-border/40 shadow-2xl rounded-xl sm:rounded-2xl">
                        {stockNavigation.map((item) => (
                          <DropdownMenuItem
                            key={item.name}
                            onClick={() => handleNavigate(item.href)}
                            className={cn(
                              "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 my-0.5",
                              isActiveRoute(item.href) 
                                ? "bg-gradient-to-r from-success/15 to-success/5 text-success font-semibold" 
                                : "hover:bg-accent/50"
                            )}
                          >
                            <div className={cn(
                              "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg",
                              isActiveRoute(item.href) ? "bg-success/20" : "bg-muted/30"
                            )}>
                              <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </div>
                            <span className="text-xs sm:text-sm">{item.name}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  {/* Reports */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className={cn(
                      "flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300",
                      isActiveGroup(reportNavigation) 
                        ? "bg-gradient-to-r from-warning/15 to-warning/5 text-warning ring-1 ring-warning/30" 
                        : "hover:bg-accent/50"
                    )}>
                      <div className={cn(
                        "flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-300",
                        isActiveGroup(reportNavigation) 
                          ? "bg-gradient-to-br from-warning to-warning/80 text-warning-foreground shadow-lg shadow-warning/25" 
                          : "bg-muted/50"
                      )}>
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs sm:text-sm font-semibold block truncate">ڕاپۆرتەکان</span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate block">بەسەرچوون، ئینڤۆیس، ئیمپۆرت</span>
                      </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="w-56 sm:w-64 p-1.5 sm:p-2 bg-popover/98 backdrop-blur-2xl border-2 border-border/40 shadow-2xl rounded-xl sm:rounded-2xl">
                        {reportNavigation.map((item) => (
                          <DropdownMenuItem
                            key={item.name}
                            onClick={() => handleNavigate(item.href)}
                            className={cn(
                              "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 my-0.5",
                              isActiveRoute(item.href) 
                                ? "bg-gradient-to-r from-warning/15 to-warning/5 text-warning font-semibold" 
                                : "hover:bg-accent/50"
                            )}
                          >
                            <div className={cn(
                              "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg",
                              isActiveRoute(item.href) ? "bg-warning/20" : "bg-muted/30"
                            )}>
                              <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </div>
                            <span className="text-xs sm:text-sm">{item.name}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  {/* Settings */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className={cn(
                      "flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300",
                      isActiveGroup(settingsNavigation) 
                        ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary ring-1 ring-primary/30" 
                        : "hover:bg-accent/50"
                    )}>
                      <div className={cn(
                        "flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-300",
                        isActiveGroup(settingsNavigation) 
                          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25" 
                          : "bg-muted/50"
                      )}>
                        <Wrench className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs sm:text-sm font-semibold block truncate">ڕێکخستن</span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate block">کەتەگۆری، براند، ڕێکخستنەکان</span>
                      </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="w-56 sm:w-64 p-1.5 sm:p-2 bg-popover/98 backdrop-blur-2xl border-2 border-border/40 shadow-2xl rounded-xl sm:rounded-2xl">
                        {settingsNavigation.map((item) => (
                          <DropdownMenuItem
                            key={item.name}
                            onClick={() => handleNavigate(item.href)}
                            className={cn(
                              "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 my-0.5",
                              isActiveRoute(item.href) 
                                ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-semibold" 
                                : "hover:bg-accent/50"
                            )}
                          >
                            <div className={cn(
                              "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg",
                              isActiveRoute(item.href) ? "bg-primary/20" : "bg-muted/30"
                            )}>
                              <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </div>
                            <span className="text-xs sm:text-sm">{item.name}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  {/* Admin */}
                  {isAdmin && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className={cn(
                        "flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300",
                        isActiveGroup(adminNavigation) 
                          ? "bg-gradient-to-r from-destructive/15 to-destructive/5 text-destructive ring-1 ring-destructive/30" 
                          : "hover:bg-accent/50"
                      )}>
                        <div className={cn(
                          "flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-300",
                          isActiveGroup(adminNavigation) 
                            ? "bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground shadow-lg shadow-destructive/25" 
                            : "bg-muted/50"
                        )}>
                          <Shield className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs sm:text-sm font-semibold block truncate">بەڕێوەبەر</span>
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate block">بەکارهێنەران و ڕۆڵەکان</span>
                        </div>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-56 sm:w-64 p-1.5 sm:p-2 bg-popover/98 backdrop-blur-2xl border-2 border-border/40 shadow-2xl rounded-xl sm:rounded-2xl">
                          {adminNavigation.map((item) => (
                            <DropdownMenuItem
                              key={item.name}
                              onClick={() => handleNavigate(item.href)}
                              className={cn(
                                "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 my-0.5",
                                isActiveRoute(item.href) 
                                  ? "bg-gradient-to-r from-destructive/15 to-destructive/5 text-destructive font-semibold" 
                                  : "hover:bg-accent/50"
                              )}
                            >
                              <div className={cn(
                                "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg",
                                isActiveRoute(item.href) ? "bg-destructive/20" : "bg-muted/30"
                              )}>
                                <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </div>
                              <span className="text-xs sm:text-sm">{item.name}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "h-12 sm:h-14 px-2 sm:px-4 gap-3 rounded-2xl",
                    "hover:bg-accent/40 transition-all duration-300",
                    "border border-transparent hover:border-border/50"
                  )}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-xl blur opacity-30" />
                    <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/20">
                      <span className="text-base sm:text-lg font-bold">
                        {user?.email?.charAt(0).toUpperCase() || 'ب'}
                      </span>
                    </div>
                  </div>
                  <div className="hidden lg:block text-right">
                    <p className="text-sm font-bold text-foreground">
                      {user?.user_metadata?.full_name || 'بەکارهێنەر'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                      {user?.email}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden lg:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-64 p-3 bg-popover/98 backdrop-blur-2xl border-2 border-border/40 shadow-2xl rounded-2xl"
                sideOffset={12}
              >
                <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
                    <span className="text-lg font-bold">
                      {user?.email?.charAt(0).toUpperCase() || 'ب'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{user?.user_metadata?.full_name || 'بەکارهێنەر'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200 mt-2"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold">چوونەدەرەوە</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
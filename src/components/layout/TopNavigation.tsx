import { useState } from "react";
import { cn } from "@/lib/utils";
import { getGravatarUrl } from "@/lib/gravatar";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  User,
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
  const isMobile = useIsMobile();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

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
                className="w-[calc(100vw-1.5rem)] sm:w-96 max-w-[400px] p-2 sm:p-3 bg-popover border-2 border-border/60 shadow-2xl shadow-black/30 rounded-2xl sm:rounded-3xl max-h-[75vh] overflow-y-auto z-[100]"
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
                <div className="space-y-1">
                  {/* Stock Operations - Mobile uses Collapsible, Desktop uses SubMenu */}
                  {isMobile ? (
                    <Collapsible open={expandedGroup === 'stock'} onOpenChange={(open) => setExpandedGroup(open ? 'stock' : null)}>
                      <CollapsibleTrigger className="w-full">
                        <div className={cn(
                          "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300",
                          isActiveGroup(stockNavigation) 
                            ? "bg-gradient-to-r from-success/15 to-success/5 text-success ring-1 ring-success/30" 
                            : "hover:bg-accent/50"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300",
                              isActiveGroup(stockNavigation) 
                                ? "bg-gradient-to-br from-success to-success/80 text-success-foreground shadow-lg shadow-success/25" 
                                : "bg-muted/50"
                            )}>
                              <Boxes className="h-4 w-4" strokeWidth={2} />
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold block">جوڵەی ستۆک</span>
                              <span className="text-[9px] text-muted-foreground block">داخڵکردن، دەرکردن، ڕاستکردنەوە</span>
                            </div>
                          </div>
                          <ChevronDown className={cn("h-4 w-4 transition-transform", expandedGroup === 'stock' && "rotate-180")} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                        <div className="pr-6 space-y-1 py-1">
                          {stockNavigation.map((item) => (
                            <button
                              key={item.name}
                              onClick={() => handleNavigate(item.href)}
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                                isActiveRoute(item.href) 
                                  ? "bg-gradient-to-r from-success/15 to-success/5 text-success font-semibold" 
                                  : "hover:bg-accent/50"
                              )}
                            >
                              <div className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-lg",
                                isActiveRoute(item.href) ? "bg-success/20" : "bg-muted/30"
                              )}>
                                <item.icon className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-xs">{item.name}</span>
                            </button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className={cn(
                        "flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-300",
                        isActiveGroup(stockNavigation) 
                          ? "bg-gradient-to-r from-success/15 to-success/5 text-success ring-1 ring-success/30" 
                          : "hover:bg-accent/50"
                      )}>
                        <div className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300",
                          isActiveGroup(stockNavigation) 
                            ? "bg-gradient-to-br from-success to-success/80 text-success-foreground shadow-lg shadow-success/25" 
                            : "bg-muted/50"
                        )}>
                          <Boxes className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold block truncate">جوڵەی ستۆک</span>
                          <span className="text-[10px] text-muted-foreground truncate block">داخڵکردن، دەرکردن، ڕاستکردنەوە</span>
                        </div>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-64 p-2 bg-popover border-2 border-border/40 shadow-2xl rounded-2xl">
                          {stockNavigation.map((item) => (
                            <DropdownMenuItem
                              key={item.name}
                              onClick={() => handleNavigate(item.href)}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 my-0.5",
                                isActiveRoute(item.href) 
                                  ? "bg-gradient-to-r from-success/15 to-success/5 text-success font-semibold" 
                                  : "hover:bg-accent/50"
                              )}
                            >
                              <div className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg",
                                isActiveRoute(item.href) ? "bg-success/20" : "bg-muted/30"
                              )}>
                                <item.icon className="h-4 w-4" />
                              </div>
                              <span className="text-sm">{item.name}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  )}

                  {/* Reports */}
                  {isMobile ? (
                    <Collapsible open={expandedGroup === 'reports'} onOpenChange={(open) => setExpandedGroup(open ? 'reports' : null)}>
                      <CollapsibleTrigger className="w-full">
                        <div className={cn(
                          "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300",
                          isActiveGroup(reportNavigation) 
                            ? "bg-gradient-to-r from-warning/15 to-warning/5 text-warning ring-1 ring-warning/30" 
                            : "hover:bg-accent/50"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300",
                              isActiveGroup(reportNavigation) 
                                ? "bg-gradient-to-br from-warning to-warning/80 text-warning-foreground shadow-lg shadow-warning/25" 
                                : "bg-muted/50"
                            )}>
                              <FileText className="h-4 w-4" strokeWidth={2} />
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold block">ڕاپۆرتەکان</span>
                              <span className="text-[9px] text-muted-foreground block">بەسەرچوون، ئینڤۆیس، ئیمپۆرت</span>
                            </div>
                          </div>
                          <ChevronDown className={cn("h-4 w-4 transition-transform", expandedGroup === 'reports' && "rotate-180")} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                        <div className="pr-6 space-y-1 py-1">
                          {reportNavigation.map((item) => (
                            <button
                              key={item.name}
                              onClick={() => handleNavigate(item.href)}
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                                isActiveRoute(item.href) 
                                  ? "bg-gradient-to-r from-warning/15 to-warning/5 text-warning font-semibold" 
                                  : "hover:bg-accent/50"
                              )}
                            >
                              <div className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-lg",
                                isActiveRoute(item.href) ? "bg-warning/20" : "bg-muted/30"
                              )}>
                                <item.icon className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-xs">{item.name}</span>
                            </button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className={cn(
                        "flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-300",
                        isActiveGroup(reportNavigation) 
                          ? "bg-gradient-to-r from-warning/15 to-warning/5 text-warning ring-1 ring-warning/30" 
                          : "hover:bg-accent/50"
                      )}>
                        <div className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300",
                          isActiveGroup(reportNavigation) 
                            ? "bg-gradient-to-br from-warning to-warning/80 text-warning-foreground shadow-lg shadow-warning/25" 
                            : "bg-muted/50"
                        )}>
                          <FileText className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold block truncate">ڕاپۆرتەکان</span>
                          <span className="text-[10px] text-muted-foreground truncate block">بەسەرچوون، ئینڤۆیس، ئیمپۆرت</span>
                        </div>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-64 p-2 bg-popover border-2 border-border/40 shadow-2xl rounded-2xl">
                          {reportNavigation.map((item) => (
                            <DropdownMenuItem
                              key={item.name}
                              onClick={() => handleNavigate(item.href)}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 my-0.5",
                                isActiveRoute(item.href) 
                                  ? "bg-gradient-to-r from-warning/15 to-warning/5 text-warning font-semibold" 
                                  : "hover:bg-accent/50"
                              )}
                            >
                              <div className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg",
                                isActiveRoute(item.href) ? "bg-warning/20" : "bg-muted/30"
                              )}>
                                <item.icon className="h-4 w-4" />
                              </div>
                              <span className="text-sm">{item.name}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  )}

                  {/* Settings */}
                  {isMobile ? (
                    <Collapsible open={expandedGroup === 'settings'} onOpenChange={(open) => setExpandedGroup(open ? 'settings' : null)}>
                      <CollapsibleTrigger className="w-full">
                        <div className={cn(
                          "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300",
                          isActiveGroup(settingsNavigation) 
                            ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary ring-1 ring-primary/30" 
                            : "hover:bg-accent/50"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300",
                              isActiveGroup(settingsNavigation) 
                                ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25" 
                                : "bg-muted/50"
                            )}>
                              <Wrench className="h-4 w-4" strokeWidth={2} />
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold block">ڕێکخستن</span>
                              <span className="text-[9px] text-muted-foreground block">کەتەگۆری، براند، ڕێکخستنەکان</span>
                            </div>
                          </div>
                          <ChevronDown className={cn("h-4 w-4 transition-transform", expandedGroup === 'settings' && "rotate-180")} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                        <div className="pr-6 space-y-1 py-1">
                          {settingsNavigation.map((item) => (
                            <button
                              key={item.name}
                              onClick={() => handleNavigate(item.href)}
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                                isActiveRoute(item.href) 
                                  ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-semibold" 
                                  : "hover:bg-accent/50"
                              )}
                            >
                              <div className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-lg",
                                isActiveRoute(item.href) ? "bg-primary/20" : "bg-muted/30"
                              )}>
                                <item.icon className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-xs">{item.name}</span>
                            </button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className={cn(
                        "flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-300",
                        isActiveGroup(settingsNavigation) 
                          ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary ring-1 ring-primary/30" 
                          : "hover:bg-accent/50"
                      )}>
                        <div className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300",
                          isActiveGroup(settingsNavigation) 
                            ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25" 
                            : "bg-muted/50"
                        )}>
                          <Wrench className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold block truncate">ڕێکخستن</span>
                          <span className="text-[10px] text-muted-foreground truncate block">کەتەگۆری، براند، ڕێکخستنەکان</span>
                        </div>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-64 p-2 bg-popover border-2 border-border/40 shadow-2xl rounded-2xl">
                          {settingsNavigation.map((item) => (
                            <DropdownMenuItem
                              key={item.name}
                              onClick={() => handleNavigate(item.href)}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 my-0.5",
                                isActiveRoute(item.href) 
                                  ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-semibold" 
                                  : "hover:bg-accent/50"
                              )}
                            >
                              <div className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg",
                                isActiveRoute(item.href) ? "bg-primary/20" : "bg-muted/30"
                              )}>
                                <item.icon className="h-4 w-4" />
                              </div>
                              <span className="text-sm">{item.name}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  )}

                  {/* Admin */}
                  {isAdmin && (
                    isMobile ? (
                      <Collapsible open={expandedGroup === 'admin'} onOpenChange={(open) => setExpandedGroup(open ? 'admin' : null)}>
                        <CollapsibleTrigger className="w-full">
                          <div className={cn(
                            "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300",
                            isActiveGroup(adminNavigation) 
                              ? "bg-gradient-to-r from-destructive/15 to-destructive/5 text-destructive ring-1 ring-destructive/30" 
                              : "hover:bg-accent/50"
                          )}>
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300",
                                isActiveGroup(adminNavigation) 
                                  ? "bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground shadow-lg shadow-destructive/25" 
                                  : "bg-muted/50"
                              )}>
                                <Shield className="h-4 w-4" strokeWidth={2} />
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-semibold block">بەڕێوەبەر</span>
                                <span className="text-[9px] text-muted-foreground block">بەکارهێنەران و ڕۆڵەکان</span>
                              </div>
                            </div>
                            <ChevronDown className={cn("h-4 w-4 transition-transform", expandedGroup === 'admin' && "rotate-180")} />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                          <div className="pr-6 space-y-1 py-1">
                            {adminNavigation.map((item) => (
                              <button
                                key={item.name}
                                onClick={() => handleNavigate(item.href)}
                                className={cn(
                                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                                  isActiveRoute(item.href) 
                                    ? "bg-gradient-to-r from-destructive/15 to-destructive/5 text-destructive font-semibold" 
                                    : "hover:bg-accent/50"
                                )}
                              >
                                <div className={cn(
                                  "flex h-7 w-7 items-center justify-center rounded-lg",
                                  isActiveRoute(item.href) ? "bg-destructive/20" : "bg-muted/30"
                                )}>
                                  <item.icon className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs">{item.name}</span>
                              </button>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className={cn(
                          "flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-300",
                          isActiveGroup(adminNavigation) 
                            ? "bg-gradient-to-r from-destructive/15 to-destructive/5 text-destructive ring-1 ring-destructive/30" 
                            : "hover:bg-accent/50"
                        )}>
                          <div className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300",
                            isActiveGroup(adminNavigation) 
                              ? "bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground shadow-lg shadow-destructive/25" 
                              : "bg-muted/50"
                          )}>
                            <Shield className="h-5 w-5" strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold block truncate">بەڕێوەبەر</span>
                            <span className="text-[10px] text-muted-foreground truncate block">بەکارهێنەران و ڕۆڵەکان</span>
                          </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent className="w-64 p-2 bg-popover border-2 border-border/40 shadow-2xl rounded-2xl">
                            {adminNavigation.map((item) => (
                              <DropdownMenuItem
                                key={item.name}
                                onClick={() => handleNavigate(item.href)}
                                className={cn(
                                  "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 my-0.5",
                                  isActiveRoute(item.href) 
                                    ? "bg-gradient-to-r from-destructive/15 to-destructive/5 text-destructive font-semibold" 
                                    : "hover:bg-accent/50"
                                )}
                              >
                                <div className={cn(
                                  "flex h-9 w-9 items-center justify-center rounded-lg",
                                  isActiveRoute(item.href) ? "bg-destructive/20" : "bg-muted/30"
                                )}>
                                  <item.icon className="h-4 w-4" />
                                </div>
                                <span className="text-sm">{item.name}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    )
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
                    "h-11 sm:h-12 px-3 sm:px-4 gap-2.5 rounded-xl",
                    "bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10",
                    "hover:from-primary/20 hover:via-accent/10 hover:to-primary/20",
                    "border border-primary/20 hover:border-primary/40",
                    "transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-primary/10"
                  )}
                >
                  <img 
                    src={getGravatarUrl(user?.email, 80)} 
                    alt="پڕۆفایل"
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg object-cover shadow-md ring-2 ring-primary/20"
                  />
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {user?.user_metadata?.full_name || 'بەکارهێنەر'}
                    </p>
                    <p className="text-[10px] text-primary/70 font-medium">باکوری خۆشەویست</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-primary/60 hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 p-2.5 bg-popover/98 backdrop-blur-2xl border border-border/50 shadow-xl rounded-xl"
                sideOffset={8}
              >
                <div className="flex items-center gap-3 px-3 py-2.5 mb-1.5 rounded-lg bg-gradient-to-r from-primary/10 to-accent/5 border border-primary/10">
                  <img 
                    src={getGravatarUrl(user?.email, 80)} 
                    alt="پڕۆفایل"
                    className="h-10 w-10 rounded-lg object-cover shadow-sm ring-2 ring-primary/10"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{user?.user_metadata?.full_name || 'بەکارهێنەر'}</p>
                    <p className="text-[10px] text-muted-foreground">باکوری خۆشەویست</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-border/40 my-1.5" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer text-destructive hover:bg-destructive/10 transition-all duration-200"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10">
                    <LogOut className="h-4 w-4" />
                  </div>
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
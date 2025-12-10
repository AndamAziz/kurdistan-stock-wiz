import { useState } from "react";
import { cn } from "@/lib/utils";
import { getGravatarUrl } from "@/lib/gravatar";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import bakuryLogo from "@/assets/bakury-logo-new.jpg";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
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
  ChevronDown,
  Boxes,
  Wrench,
  Shield,
  Store,
} from "lucide-react";
import { useLocation } from "react-router-dom";

const mainNavigation = [
  { name: 'داشبۆرد', href: '/', icon: LayoutDashboard },
  { name: 'مادەکان', href: '/items', icon: Package },
];

const stockNavigation = [
  { name: 'داخڵکردن', href: '/stock-in', icon: ArrowDownToLine },
  { name: 'ڕاستکردنەوە', href: '/stock-adjust', icon: RefreshCw },
];

const reportNavigation = [
  { name: 'بەسەرچوون', href: '/expiry', icon: AlertTriangle },
  { name: 'ئیمپۆرت/ئێکسپۆرت', href: '/import-export', icon: FileSpreadsheet },
];

const settingsNavigation = [
  { name: 'کەتەگۆریەکان', href: '/categories', icon: Tags },
  { name: 'براندەکان', href: '/brands', icon: Building2 },
  { name: 'ماڕکێتەکان', href: '/markets', icon: Store },
  { name: 'نەتەواوەکان', href: '/incomplete-markets', icon: AlertTriangle },
  { name: 'ڕێکخستنەکان', href: '/settings', icon: Settings },
];

const adminNavigation = [
  { name: 'بەکارهێنەران', href: '/user-roles', icon: Users },
];

interface SidebarProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface NavGroupProps {
  title: string;
  icon: React.ElementType;
  items: { name: string; href: string; icon: React.ElementType }[];
  onNavClick?: () => void;
  defaultOpen?: boolean;
}

function NavGroup({ title, icon: GroupIcon, items, onNavClick, defaultOpen = false }: NavGroupProps) {
  const location = useLocation();
  const isActiveGroup = items.some(item => location.pathname === item.href);
  const [isOpen, setIsOpen] = useState(defaultOpen || isActiveGroup);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-2">
      <CollapsibleTrigger className="w-full">
        <div className={cn(
          "flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 mb-1 group cursor-pointer",
          isActiveGroup 
            ? "bg-sidebar-primary/20 text-sidebar-primary-foreground border border-sidebar-primary/30" 
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground border border-transparent"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300",
              isActiveGroup 
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/30" 
                : "bg-sidebar-accent/50 text-sidebar-foreground/70 group-hover:bg-sidebar-accent group-hover:text-sidebar-foreground"
            )}>
              <GroupIcon className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="text-sm lg:text-base">{title}</span>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform duration-300 text-sidebar-foreground/50",
            isOpen && "rotate-180"
          )} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="mr-6 pr-2 border-r-2 border-sidebar-accent/50 space-y-1 py-2">
          {items.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onNavClick}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                "text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground hover:pr-4"
              )}
              activeClassName="bg-gradient-to-r from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground shadow-md pr-4"
            >
              <item.icon className="h-4 w-4" strokeWidth={2} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRoles();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex h-full flex-col bg-gradient-sidebar">
      {/* Logo */}
      <div className="flex h-24 lg:h-28 items-center justify-center border-b border-sidebar-border/30 px-4 lg:px-6 bg-sidebar-accent/10">
        <div className="text-center">
          <div className="relative inline-block">
            {/* Outer decorative glow */}
            <div className="absolute -inset-3 bg-gradient-to-br from-sidebar-primary/20 via-sidebar-primary/10 to-sidebar-accent/20 rounded-xl blur-lg"></div>
            {/* Logo container - clean white background */}
            <div className="relative bg-white rounded-xl shadow-lg shadow-sidebar-primary/15 p-1.5">
              <img 
                src={bakuryLogo} 
                alt="باکوری خۆشەویست" 
                className="w-14 h-14 lg:w-16 lg:h-16 object-contain"
              />
            </div>
          </div>
          <p className="text-[9px] lg:text-[10px] text-sidebar-foreground/50 font-medium mt-2">
            سیستمی بەڕێوەبردنی کۆگا
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 lg:px-4 py-4 lg:py-6 overflow-y-auto scrollbar-thin">
        {/* Main Items - No dropdown */}
        <div className="mb-4">
          {mainNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onNavClick}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm lg:text-base font-medium transition-all duration-200 mb-2",
                "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground border border-transparent hover:border-sidebar-accent"
              )}
              activeClassName="bg-gradient-to-r from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground shadow-lg border-sidebar-primary/30"
            >
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300",
                location.pathname === item.href 
                  ? "bg-white/20 shadow-inner" 
                  : "bg-sidebar-accent/50 group-hover:bg-sidebar-accent"
              )}>
                <item.icon className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* Stock Operations Dropdown */}
        <NavGroup 
          title="جوڵەی ستۆک" 
          icon={Boxes} 
          items={stockNavigation} 
          onNavClick={onNavClick}
        />

        {/* Reports Dropdown */}
        <NavGroup 
          title="ڕاپۆرتەکان" 
          icon={FileText} 
          items={reportNavigation} 
          onNavClick={onNavClick}
        />

        {/* Settings Dropdown */}
        <NavGroup 
          title="ڕێکخستن" 
          icon={Wrench} 
          items={settingsNavigation} 
          onNavClick={onNavClick}
        />

        {/* Admin Dropdown */}
        {isAdmin && (
          <NavGroup 
            title="بەڕێوەبەر" 
            icon={Shield} 
            items={adminNavigation} 
            onNavClick={onNavClick}
          />
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border/30 p-4 lg:p-5 bg-sidebar-accent/10">
        <div className="flex items-center justify-between gap-3 p-3 lg:p-4 rounded-2xl bg-gradient-to-br from-sidebar-accent/40 to-sidebar-accent/20 border border-sidebar-border/30 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <img 
              src={getGravatarUrl(user?.email, 80)} 
              alt="پڕۆفایل"
              className="h-12 w-12 lg:h-14 lg:w-14 rounded-xl object-cover shadow-lg ring-2 ring-sidebar-primary/20 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm lg:text-base font-bold text-sidebar-foreground truncate">
                {user?.user_metadata?.full_name || 'بەکارهێنەر'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/15 h-11 w-11 rounded-xl shrink-0 transition-all duration-200 hover:scale-105"
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
      <header className="lg:hidden fixed top-0 right-0 left-0 z-50 h-16 bg-gradient-sidebar border-b border-sidebar-border/30 flex items-center justify-between px-4 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <img 
            src={bakuryLogo} 
            alt="باکوری خۆشەویست" 
            className="h-10 w-10 object-contain rounded-lg"
          />
          <h1 className="text-base font-bold text-sidebar-foreground tracking-tight">
            باکوری خۆشەویست
          </h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-xl h-11 w-11 transition-all duration-200 hover:scale-105"
          onClick={() => onOpenChange?.(!isOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile Sheet */}
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-80 p-0 border-l border-sidebar-border/30">
          <SidebarContent onNavClick={() => onOpenChange?.(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed right-0 top-0 z-40 h-screen w-72 xl:w-80 2xl:w-96 shadow-2xl">
        <SidebarContent />
      </aside>
    </>
  );
}

export function MobileMenuButton() {
  return null;
}
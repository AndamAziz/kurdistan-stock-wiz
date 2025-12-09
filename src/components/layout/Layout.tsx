import { ReactNode, useState } from "react";
import { TopNavigation } from "./TopNavigation";
import { BottomNav } from "./BottomNav";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NavLink } from "@/components/NavLink";
import { 
  Settings, 
  Clock, 
  FileText, 
  Tag, 
  FolderOpen, 
  FileSpreadsheet,
  Users,
  BarChart3
} from "lucide-react";
import { useUserRoles } from "@/hooks/useUserRoles";

interface LayoutProps {
  children: ReactNode;
}

const moreMenuItems = [
  { name: 'ڕێکخستنەکان', href: '/settings', icon: Settings },
  { name: 'بەسەرچوون', href: '/expiry', icon: Clock },
  { name: 'وەسڵەکان', href: '/invoices', icon: FileText },
  { name: 'براندەکان', href: '/brands', icon: Tag },
  { name: 'جۆرەکان', href: '/categories', icon: FolderOpen },
  { name: 'هاوردە/هەناردە', href: '/import-export', icon: FileSpreadsheet },
  { name: 'ڕاپۆرتی ستۆک', href: '/stock-adjust', icon: BarChart3 },
];

export function Layout({ children }: LayoutProps) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const { isAdmin } = useUserRoles();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <TopNavigation />
      
      {/* Main content area */}
      <main className="min-h-[calc(100vh-5rem)] pb-24 lg:pb-8">
        <div className="p-4 sm:p-6 lg:p-10 xl:p-12 max-w-[1800px] mx-auto">
          {children}
        </div>
      </main>
      
      {/* Bottom Navigation for Mobile */}
      <BottomNav onMenuClick={() => setMoreMenuOpen(true)} />

      {/* More Menu Sheet */}
      <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-safe max-h-[70vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-center text-lg font-bold">زیاتر</SheetTitle>
          </SheetHeader>
          
          <div className="grid grid-cols-3 gap-4 py-4">
            {moreMenuItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setMoreMenuOpen(false)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors"
                activeClassName="bg-primary/10 text-primary"
              >
                <div className="p-3 rounded-xl bg-background shadow-sm">
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-center">{item.name}</span>
              </NavLink>
            ))}
            
            {/* User Roles - Admin Only */}
            {isAdmin && (
              <NavLink
                to="/user-roles"
                onClick={() => setMoreMenuOpen(false)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors"
                activeClassName="bg-primary/10 text-primary"
              >
                <div className="p-3 rounded-xl bg-background shadow-sm">
                  <Users className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-center">ڕۆڵی بەکارهێنەران</span>
              </NavLink>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

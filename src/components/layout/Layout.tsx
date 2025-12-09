import { ReactNode } from "react";
import { TopNavigation } from "./TopNavigation";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
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
      <BottomNav onMenuClick={() => {}} />
    </div>
  );
}

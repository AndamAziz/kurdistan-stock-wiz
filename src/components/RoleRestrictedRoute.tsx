import { Navigate } from 'react-router-dom';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { Loader2 } from 'lucide-react';

interface RoleRestrictedRouteProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  redirectTo?: string;
}

export function RoleRestrictedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/mandwb' 
}: RoleRestrictedRouteProps) {
  const { currentUserRoles, isLoadingCurrentUserRoles } = useUserRoles();

  if (isLoadingCurrentUserRoles) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">چاوەڕوان بە...</p>
        </div>
      </div>
    );
  }

  // Check if user has any of the allowed roles
  const hasAllowedRole = allowedRoles.some(role => currentUserRoles.includes(role));

  if (!hasAllowedRole) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

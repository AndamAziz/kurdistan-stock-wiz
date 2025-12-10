import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRoles } from "@/hooks/useUserRoles";
import Dashboard from "./Dashboard";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { isMandwb, isLoadingCurrentUserRoles, currentUserRoles } = useUserRoles();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is mandwb only (not admin or storekeeper), redirect to mandwb dashboard
    if (!isLoadingCurrentUserRoles && currentUserRoles.length > 0) {
      const isOnlyMandwb = isMandwb && 
        !currentUserRoles.includes('admin') && 
        !currentUserRoles.includes('storekeeper');
      
      if (isOnlyMandwb) {
        navigate('/mandwb', { replace: true });
      }
    }
  }, [isMandwb, isLoadingCurrentUserRoles, currentUserRoles, navigate]);

  if (isLoadingCurrentUserRoles) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <Dashboard />;
};

export default Index;

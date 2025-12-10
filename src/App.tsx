import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { MandwbTabProvider } from "@/hooks/useMandwbTab";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleRestrictedRoute } from "@/components/RoleRestrictedRoute";
import { NotificationChecker } from "@/components/NotificationChecker";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Items from "./pages/Items";
import StockIn from "./pages/StockIn";
import StockAdjust from "./pages/StockAdjust";
import Expiry from "./pages/Expiry";
import Categories from "./pages/Categories";
import Brands from "./pages/Brands";
import ImportExport from "./pages/ImportExport";
import Settings from "./pages/Settings";
import UserRoles from "./pages/UserRoles";
import Markets from "./pages/Markets";
import IncompleteMarkets from "./pages/IncompleteMarkets";
import DeliveryPersons from "./pages/DeliveryPersons";
import MandwbDashboard from "./pages/MandwbDashboard";
import VisitReports from "./pages/VisitReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Roles that can access inventory management pages (not mandwb)
const inventoryRoles = ['admin', 'storekeeper', 'viewer'] as const;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <MandwbTabProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <NotificationChecker />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                
                {/* Inventory pages - NOT accessible by mandwb */}
                <Route path="/items" element={
                  <ProtectedRoute>
                    <RoleRestrictedRoute allowedRoles={[...inventoryRoles]}>
                      <Items />
                    </RoleRestrictedRoute>
                  </ProtectedRoute>
                } />
                <Route path="/stock-in" element={
                  <ProtectedRoute>
                    <RoleRestrictedRoute allowedRoles={[...inventoryRoles]}>
                      <StockIn />
                    </RoleRestrictedRoute>
                  </ProtectedRoute>
                } />
                <Route path="/stock-adjust" element={
                  <ProtectedRoute>
                    <RoleRestrictedRoute allowedRoles={[...inventoryRoles]}>
                      <StockAdjust />
                    </RoleRestrictedRoute>
                  </ProtectedRoute>
                } />
                <Route path="/expiry" element={
                  <ProtectedRoute>
                    <RoleRestrictedRoute allowedRoles={[...inventoryRoles]}>
                      <Expiry />
                    </RoleRestrictedRoute>
                  </ProtectedRoute>
                } />
                <Route path="/categories" element={
                  <ProtectedRoute>
                    <RoleRestrictedRoute allowedRoles={[...inventoryRoles]}>
                      <Categories />
                    </RoleRestrictedRoute>
                  </ProtectedRoute>
                } />
                <Route path="/brands" element={
                  <ProtectedRoute>
                    <RoleRestrictedRoute allowedRoles={[...inventoryRoles]}>
                      <Brands />
                    </RoleRestrictedRoute>
                  </ProtectedRoute>
                } />
                <Route path="/import-export" element={
                  <ProtectedRoute>
                    <RoleRestrictedRoute allowedRoles={[...inventoryRoles]}>
                      <ImportExport />
                    </RoleRestrictedRoute>
                  </ProtectedRoute>
                } />
                <Route path="/markets" element={
                  <ProtectedRoute>
                    <RoleRestrictedRoute allowedRoles={[...inventoryRoles]}>
                      <Markets />
                    </RoleRestrictedRoute>
                  </ProtectedRoute>
                } />
                <Route path="/incomplete-markets" element={
                  <ProtectedRoute>
                    <RoleRestrictedRoute allowedRoles={[...inventoryRoles]}>
                      <IncompleteMarkets />
                    </RoleRestrictedRoute>
                  </ProtectedRoute>
                } />
                
                {/* Settings - accessible by all */}
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                
                {/* Admin only pages */}
                <Route path="/user-roles" element={
                  <ProtectedRoute>
                    <RoleRestrictedRoute allowedRoles={['admin']}>
                      <UserRoles />
                    </RoleRestrictedRoute>
                  </ProtectedRoute>
                } />
                <Route path="/delivery-persons" element={
                  <ProtectedRoute>
                    <RoleRestrictedRoute allowedRoles={['admin']}>
                      <DeliveryPersons />
                    </RoleRestrictedRoute>
                  </ProtectedRoute>
                } />
                <Route path="/visit-reports" element={
                  <ProtectedRoute>
                    <RoleRestrictedRoute allowedRoles={['admin']}>
                      <VisitReports />
                    </RoleRestrictedRoute>
                  </ProtectedRoute>
                } />
                
                {/* Mandwb dashboard - accessible by mandwb role */}
                <Route path="/mandwb" element={
                  <ProtectedRoute>
                    <RoleRestrictedRoute allowedRoles={['mandwb', 'admin']} redirectTo="/">
                      <MandwbDashboard />
                    </RoleRestrictedRoute>
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </MandwbTabProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

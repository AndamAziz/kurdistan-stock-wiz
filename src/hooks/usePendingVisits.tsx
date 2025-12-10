import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from './useUserRoles';

export function usePendingVisitsCount() {
  const { isAdmin } = useUserRoles();

  return useQuery({
    queryKey: ['pending-visits-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('market_visits')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: isAdmin,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

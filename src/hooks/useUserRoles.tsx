import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type AppRole = 'admin' | 'storekeeper' | 'viewer' | 'mandwb';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  roles: AppRole[];
}

export function useUserRoles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if current user has a specific role
  const { data: currentUserRoles = [], isLoading: isLoadingCurrentUserRoles } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data.map(r => r.role as AppRole);
    },
    enabled: !!user?.id,
  });

  const isAdmin = currentUserRoles.includes('admin');
  const isStorekeeper = currentUserRoles.includes('storekeeper');
  const isViewer = currentUserRoles.includes('viewer');
  const isMandwb = currentUserRoles.includes('mandwb');

  // Fetch all users with their roles (admin only - RLS enforces this)
  const { data: usersWithRoles = [], isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['all-users-with-roles'],
    queryFn: async () => {
      // Get all user roles - RLS policy allows admins to see all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      // Build users map from roles data
      const usersMap = new Map<string, UserWithRole>();

      roles.forEach(role => {
        if (!usersMap.has(role.user_id)) {
          usersMap.set(role.user_id, {
            id: role.user_id,
            email: '',
            full_name: null,
            roles: [],
          });
        }
        usersMap.get(role.user_id)!.roles.push(role.role as AppRole);
      });

      // Fetch profiles for users we have roles for - admin can see all profiles via RLS policy
      const userIds = Array.from(usersMap.keys());
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        
        if (profiles) {
          profiles.forEach(profile => {
            const user = usersMap.get(profile.id);
            if (user) {
              user.full_name = profile.full_name;
            }
          });
        }
      }

      return Array.from(usersMap.values());
    },
    enabled: isAdmin,
  });

  // Assign role to user
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users-with-roles'] });
      toast.success('ڕۆڵ زیادکرا');
    },
    onError: (error: Error) => {
      console.error('Error assigning role:', error);
      toast.error('هەڵەیەک ڕوویدا لە زیادکردنی ڕۆڵ');
    },
  });

  // Remove role from user
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users-with-roles'] });
      toast.success('ڕۆڵ سڕایەوە');
    },
    onError: (error: Error) => {
      console.error('Error removing role:', error);
      toast.error('هەڵەیەک ڕوویدا لە سڕینەوەی ڕۆڵ');
    },
  });

  return {
    currentUserRoles,
    isAdmin,
    isStorekeeper,
    isViewer,
    isMandwb,
    isLoadingCurrentUserRoles,
    usersWithRoles,
    isLoadingUsers,
    refetchUsers,
    assignRole: assignRoleMutation.mutate,
    removeRole: removeRoleMutation.mutate,
    isAssigningRole: assignRoleMutation.isPending,
    isRemovingRole: removeRoleMutation.isPending,
  };
}

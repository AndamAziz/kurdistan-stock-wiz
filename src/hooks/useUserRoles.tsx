import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type AppRole = 'admin' | 'storekeeper' | 'viewer';

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

  // Fetch all users with their roles
  const { data: usersWithRoles = [], isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['all-users-with-roles'],
    queryFn: async () => {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name');
      
      if (profilesError) throw profilesError;

      // Then get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) throw rolesError;

      // Get user emails from auth (we need to get this from profiles or user metadata)
      // Since we can't access auth.users directly, we'll need the email from the current context
      const usersMap = new Map<string, UserWithRole>();

      profiles.forEach(profile => {
        usersMap.set(profile.id, {
          id: profile.id,
          email: '', // Will be filled if we have access
          full_name: profile.full_name,
          roles: [],
        });
      });

      roles.forEach(role => {
        const userEntry = usersMap.get(role.user_id);
        if (userEntry) {
          userEntry.roles.push(role.role as AppRole);
        }
      });

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

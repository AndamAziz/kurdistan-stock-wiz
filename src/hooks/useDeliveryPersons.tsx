import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DeliveryPerson {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketAssignment {
  id: string;
  delivery_person_id: string;
  market_id: string;
  assigned_at: string;
  market?: {
    id: string;
    code: string;
    name: string;
    phone: string | null;
    city: string | null;
    zone: string | null;
  };
}

export interface MarketVisit {
  id: string;
  delivery_person_id: string;
  market_id: string;
  visit_date: string;
  notes: string | null;
  status: string;
  created_at: string;
  market?: {
    id: string;
    code: string;
    name: string;
  };
  delivery_person?: {
    id: string;
    name: string;
  };
}

export interface VisitItem {
  id: string;
  visit_id: string;
  item_id: string;
  quantity: number;
  issue_type: string;
  action_taken: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  item?: {
    id: string;
    name: string;
    barcode: string;
    exp_date: string | null;
  };
}

// Hook for current user's delivery person profile
export function useCurrentDeliveryPerson() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['current-delivery-person', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('delivery_persons')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as DeliveryPerson | null;
    },
    enabled: !!user?.id,
  });
}

// Hook for all delivery persons (admin)
export function useDeliveryPersons() {
  return useQuery({
    queryKey: ['delivery-persons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_persons')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as DeliveryPerson[];
    },
  });
}

// Hook for assigned markets
export function useAssignedMarkets(deliveryPersonId: string | undefined) {
  return useQuery({
    queryKey: ['assigned-markets', deliveryPersonId],
    queryFn: async () => {
      if (!deliveryPersonId) return [];
      
      const { data, error } = await supabase
        .from('market_assignments')
        .select(`
          *,
          market:markets(id, code, name, phone, city, zone)
        `)
        .eq('delivery_person_id', deliveryPersonId);
      
      if (error) throw error;
      return data as MarketAssignment[];
    },
    enabled: !!deliveryPersonId,
  });
}

// Hook for market visits
export function useMarketVisits(deliveryPersonId?: string | null, status?: string) {
  return useQuery({
    queryKey: ['market-visits', deliveryPersonId, status],
    queryFn: async () => {
      let query = supabase
        .from('market_visits')
        .select(`
          *,
          market:markets(id, code, name),
          delivery_person:delivery_persons(id, name)
        `)
        .order('visit_date', { ascending: false });
      
      if (deliveryPersonId) {
        query = query.eq('delivery_person_id', deliveryPersonId);
      }
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as MarketVisit[];
    },
  });
}

// Hook for visit items
export function useVisitItems(visitId: string | undefined) {
  return useQuery({
    queryKey: ['visit-items', visitId],
    queryFn: async () => {
      if (!visitId) return [];
      
      const { data, error } = await supabase
        .from('visit_items')
        .select(`
          *,
          item:items(id, name, barcode, exp_date)
        `)
        .eq('visit_id', visitId);
      
      if (error) throw error;
      return data as VisitItem[];
    },
    enabled: !!visitId,
  });
}

// Mutation hooks
export function useAddDeliveryPerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { user_id: string; name: string; phone?: string }) => {
      const { error } = await supabase
        .from('delivery_persons')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-persons'] });
      toast.success('مەندوب زیادکرا');
    },
    onError: (error: Error) => {
      console.error('Error adding delivery person:', error);
      toast.error('هەڵەیەک ڕوویدا');
    },
  });
}

export function useAssignMarket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { delivery_person_id: string; market_id: string }) => {
      const { error } = await supabase
        .from('market_assignments')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assigned-markets'] });
      toast.success('ماڕکێت دەستنیشانکرا');
    },
    onError: (error: Error) => {
      console.error('Error assigning market:', error);
      if (error.message.includes('duplicate')) {
        toast.error('ئەم ماڕکێتە پێشتر دەستنیشانکراوە');
      } else {
        toast.error('هەڵەیەک ڕوویدا');
      }
    },
  });
}

export function useUnassignMarket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('market_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assigned-markets'] });
      toast.success('ماڕکێت لابرا');
    },
    onError: (error: Error) => {
      console.error('Error unassigning market:', error);
      toast.error('هەڵەیەک ڕوویدا');
    },
  });
}

export function useCreateVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      delivery_person_id: string; 
      market_id: string; 
      notes?: string;
    }) => {
      const { data: visit, error } = await supabase
        .from('market_visits')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return visit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-visits'] });
      toast.success('سەردانی نوێ تۆمارکرا');
    },
    onError: (error: Error) => {
      console.error('Error creating visit:', error);
      toast.error('هەڵەیەک ڕوویدا');
    },
  });
}

export function useAddVisitItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      visit_id: string;
      item_id: string;
      quantity: number;
      issue_type: string;
    }) => {
      const { error } = await supabase
        .from('visit_items')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-items'] });
      toast.success('مادە زیادکرا');
    },
    onError: (error: Error) => {
      console.error('Error adding visit item:', error);
      toast.error('هەڵەیەک ڕوویدا');
    },
  });
}

export function useUpdateVisitStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ visitId, status }: { visitId: string; status: string }) => {
      const { error } = await supabase
        .from('market_visits')
        .update({ status })
        .eq('id', visitId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-visits'] });
      toast.success('دۆخ نوێکرایەوە');
    },
    onError: (error: Error) => {
      console.error('Error updating visit status:', error);
      toast.error('هەڵەیەک ڕوویدا');
    },
  });
}

export function useUpdateVisitItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      action_taken, 
      admin_notes 
    }: { 
      itemId: string; 
      action_taken: string;
      admin_notes?: string;
    }) => {
      const { error } = await supabase
        .from('visit_items')
        .update({ action_taken, admin_notes })
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-items'] });
      toast.success('کردار تۆمارکرا');
    },
    onError: (error: Error) => {
      console.error('Error updating visit item:', error);
      toast.error('هەڵەیەک ڕوویدا');
    },
  });
}

export function useDeleteDeliveryPerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('delivery_persons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-persons'] });
      toast.success('مەندوب سڕایەوە');
    },
    onError: (error: Error) => {
      console.error('Error deleting delivery person:', error);
      toast.error('هەڵەیەک ڕوویدا');
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Market {
  id: string;
  code: string;
  name: string;
  trader_category: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  zone: string | null;
  created_at: string;
  updated_at: string;
}

export function useMarkets() {
  return useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Market[];
    },
  });
}

export function useAddMarket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (market: {
      code: string;
      name: string;
      trader_category?: string;
      phone?: string;
      address?: string;
      city?: string;
      zone?: string;
    }) => {
      const { data, error } = await supabase
        .from('markets')
        .insert(market)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate key')) {
        toast.error('ئەم کۆدە پێشتر بەکارهاتووە');
      } else {
        toast.error('هەڵە لە زیادکردنی ماڕکێت');
      }
    },
  });
}

export function useUpsertMarket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (market: {
      code: string;
      name: string;
      trader_category?: string;
      phone?: string;
      address?: string;
      city?: string;
      zone?: string;
    }) => {
      const { data, error } = await supabase
        .from('markets')
        .upsert(market, { onConflict: 'code' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
    },
    onError: () => {
      toast.error('هەڵە لە زیادکردنی ماڕکێت');
    },
  });
}

export function useUpdateMarket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...market }: {
      id: string;
      code?: string;
      name?: string;
      trader_category?: string | null;
      phone?: string | null;
      address?: string | null;
      city?: string | null;
      zone?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('markets')
        .update(market)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      toast.success('ماڕکێتەکە نوێکرایەوە');
    },
    onError: () => {
      toast.error('هەڵە لە نوێکردنەوە');
    },
  });
}

export function useDeleteMarket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('markets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      toast.success('ماڕکێتەکە سڕایەوە');
    },
    onError: () => {
      toast.error('هەڵە لە سڕینەوە');
    },
  });
}

export function useDeleteAllMarkets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('markets')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      toast.success('هەموو ماڕکێتەکان سڕانەوە');
    },
    onError: () => {
      toast.error('هەڵە لە سڕینەوەی هەموو ماڕکێتەکان');
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ItemWithRelations {
  id: string;
  barcode: string;
  name: string;
  brand_id: string | null;
  category_id: string | null;
  unit: string;
  current_quantity: number;
  min_stock: number;
  date_added: string;
  mfg_date: string | null;
  exp_date: string | null;
  remind_date: string | null;
  image_url: string | null;
  total_in: number;
  total_out: number;
  brands: { id: string; name: string } | null;
  categories: { id: string; name: string } | null;
}

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          brands(id, name),
          categories(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ItemWithRelations[];
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}

export function useStockMovements() {
  return useQuery({
    queryKey: ['stock_movements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          items(id, name, barcode)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });
}

export function useAddItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: {
      barcode: string;
      name: string;
      brand_id?: string;
      category_id?: string;
      unit?: string;
      min_stock?: number;
      mfg_date?: string;
      exp_date?: string;
      remind_date?: string;
    }) => {
      const { data, error } = await supabase
        .from('items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('مادەکە زیادکرا');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate key')) {
        toast.error('ئەم باڕکۆدە پێشتر بەکارهاتووە');
      } else {
        toast.error('هەڵە لە زیادکردنی مادە');
      }
    },
  });
}

export function useAddStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movement: {
      item_id: string;
      movement_type: 'IN' | 'OUT' | 'ADJUST';
      quantity: number;
      movement_date?: string;
      note?: string;
      created_by?: string;
    }) => {
      const { data, error } = await supabase
        .from('stock_movements')
        .insert(movement)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
      toast.success(
        variables.movement_type === 'IN' 
          ? 'مادەکە داخڵکرا بۆ کۆگا' 
          : 'مادەکە دەرکرا لە کۆگا'
      );
    },
    onError: () => {
      toast.error('هەڵە لە تۆمارکردنی گۆڕانکاری');
    },
  });
}

export function useAddCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('هاوپۆلەکە زیادکرا');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate key')) {
        toast.error('ئەم هاوپۆڵە پێشتر هەیە');
      } else {
        toast.error('هەڵە لە زیادکردن');
      }
    },
  });
}

export function useAddBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('brands')
        .insert({ name })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('براندەکە زیادکرا');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate key')) {
        toast.error('ئەم براندە پێشتر هەیە');
      } else {
        toast.error('هەڵە لە زیادکردن');
      }
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('هاوپۆلەکە سڕایەوە');
    },
    onError: () => {
      toast.error('هەڵە لە سڕینەوە');
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('براندەکە سڕایەوە');
    },
    onError: () => {
      toast.error('هەڵە لە سڕینەوە');
    },
  });
}

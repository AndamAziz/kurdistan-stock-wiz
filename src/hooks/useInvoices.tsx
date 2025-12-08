import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: 'stock_in' | 'stock_out';
  recipient_name: string | null;
  recipient_phone: string | null;
  total_amount: number;
  invoice_date: string;
  created_at: string;
  created_by: string | null;
  notes: string | null;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_id: string | null;
  item_name: string;
  item_brand: string | null;
  item_category: string | null;
  item_barcode: string | null;
  item_unit: string | null;
  quantity: number;
  boxes: number;
  pieces: number;
  gifts: number;
  weight_kg: number;
  weight_gram: number;
  price: number;
  total_price: number;
  exp_date: string | null;
  mfg_date: string | null;
  note: string | null;
  created_at: string;
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

export interface CreateInvoiceData {
  invoice_number: string;
  invoice_type: 'stock_in' | 'stock_out';
  recipient_name?: string;
  recipient_phone?: string;
  total_amount?: number;
  invoice_date?: string;
  created_by?: string;
  notes?: string;
  items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>[];
}

export function useInvoices(type?: 'stock_in' | 'stock_out') {
  return useQuery({
    queryKey: ['invoices', type],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (type) {
        query = query.eq('invoice_type', type);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Invoice[];
    },
  });
}

export function useInvoiceWithItems(invoiceId: string | null) {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();
      
      if (invoiceError) throw invoiceError;
      
      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);
      
      if (itemsError) throw itemsError;
      
      return {
        ...invoice,
        items: items || [],
      } as InvoiceWithItems;
    },
    enabled: !!invoiceId,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateInvoiceData) => {
      // Insert invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: data.invoice_number,
          invoice_type: data.invoice_type,
          recipient_name: data.recipient_name || null,
          recipient_phone: data.recipient_phone || null,
          total_amount: data.total_amount || 0,
          invoice_date: data.invoice_date || new Date().toISOString().split('T')[0],
          created_by: data.created_by || null,
          notes: data.notes || null,
        })
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;
      
      // Insert invoice items
      if (data.items.length > 0) {
        const itemsToInsert = data.items.map(item => ({
          invoice_id: invoice.id,
          item_id: item.item_id || null,
          item_name: item.item_name,
          item_brand: item.item_brand || null,
          item_category: item.item_category || null,
          item_barcode: item.item_barcode || null,
          item_unit: item.item_unit || null,
          quantity: item.quantity || 0,
          boxes: item.boxes || 0,
          pieces: item.pieces || 0,
          gifts: item.gifts || 0,
          weight_kg: item.weight_kg || 0,
          weight_gram: item.weight_gram || 0,
          price: item.price || 0,
          total_price: item.total_price || 0,
          exp_date: item.exp_date || null,
          mfg_date: item.mfg_date || null,
          note: item.note || null,
        }));
        
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);
        
        if (itemsError) throw itemsError;
      }
      
      return invoice as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error) => {
      console.error('Error creating invoice:', error);
      toast.error('هەڵە لە هەڵگرتنی ئینڤۆیس');
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Invoice> }) => {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return invoice as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('ئینڤۆیس نوێکرایەوە');
    },
    onError: (error) => {
      console.error('Error updating invoice:', error);
      toast.error('هەڵە لە نوێکردنەوەی ئینڤۆیس');
    },
  });
}

interface UpdateInvoiceItemData {
  id: string;
  boxes?: number;
  pieces?: number;
  gifts?: number;
  quantity?: number;
  weight_kg?: number;
  weight_gram?: number;
  price?: number;
  total_price?: number;
  note?: string | null;
}

export function useUpdateInvoiceItems() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      items, 
      deletedItemIds 
    }: { 
      invoiceId: string; 
      items: UpdateInvoiceItemData[]; 
      deletedItemIds: string[];
    }) => {
      // Delete removed items
      if (deletedItemIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('invoice_items')
          .delete()
          .in('id', deletedItemIds);
        
        if (deleteError) throw deleteError;
      }
      
      // Update remaining items
      for (const item of items) {
        const { error } = await supabase
          .from('invoice_items')
          .update({
            boxes: item.boxes,
            pieces: item.pieces,
            gifts: item.gifts,
            quantity: item.quantity,
            weight_kg: item.weight_kg,
            weight_gram: item.weight_gram,
            price: item.price,
            total_price: item.total_price,
            note: item.note,
          })
          .eq('id', item.id);
        
        if (error) throw error;
      }
      
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
    },
    onError: (error) => {
      console.error('Error updating invoice items:', error);
      toast.error('هەڵە لە نوێکردنەوەی مادەکان');
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('ئینڤۆیس سڕایەوە');
    },
    onError: (error) => {
      console.error('Error deleting invoice:', error);
      toast.error('هەڵە لە سڕینەوەی ئینڤۆیس');
    },
  });
}

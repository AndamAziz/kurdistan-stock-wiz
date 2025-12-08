-- Update RLS policy for invoices to restrict storekeeper access to their own invoices
DROP POLICY IF EXISTS "Admins and storekeepers can view invoices" ON public.invoices;

CREATE POLICY "Users can view invoices based on role" 
ON public.invoices 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (has_role(auth.uid(), 'storekeeper'::app_role) AND created_by = auth.uid())
);

-- Update RLS policy for invoice_items to match invoice access
DROP POLICY IF EXISTS "Admins and storekeepers can view invoice items" ON public.invoice_items;

CREATE POLICY "Users can view invoice items based on role" 
ON public.invoice_items 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    has_role(auth.uid(), 'storekeeper'::app_role) 
    AND EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.created_by = auth.uid()
    )
  )
);
-- Create invoices table for storing stock in and stock out invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('stock_in', 'stock_out')),
  recipient_name TEXT,
  recipient_phone TEXT,
  total_amount NUMERIC DEFAULT 0,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  notes TEXT
);

-- Create invoice_items table for storing items in each invoice
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id),
  item_name TEXT NOT NULL,
  item_brand TEXT,
  item_category TEXT,
  item_barcode TEXT,
  item_unit TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  boxes INTEGER DEFAULT 0,
  pieces INTEGER DEFAULT 0,
  gifts INTEGER DEFAULT 0,
  weight_kg NUMERIC DEFAULT 0,
  weight_gram NUMERIC DEFAULT 0,
  price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  exp_date DATE,
  mfg_date DATE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Enable RLS on invoice_items
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Policies for invoices table
CREATE POLICY "Admins and storekeepers can view invoices"
ON public.invoices
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'storekeeper'::app_role));

CREATE POLICY "Admins and storekeepers can insert invoices"
ON public.invoices
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'storekeeper'::app_role));

CREATE POLICY "Admins can update invoices"
ON public.invoices
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete invoices"
ON public.invoices
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for invoice_items table
CREATE POLICY "Admins and storekeepers can view invoice items"
ON public.invoice_items
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'storekeeper'::app_role));

CREATE POLICY "Admins and storekeepers can insert invoice items"
ON public.invoice_items
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'storekeeper'::app_role));

CREATE POLICY "Admins can update invoice items"
ON public.invoice_items
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete invoice items"
ON public.invoice_items
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_invoices_date ON public.invoices(invoice_date DESC);
CREATE INDEX idx_invoices_type ON public.invoices(invoice_type);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
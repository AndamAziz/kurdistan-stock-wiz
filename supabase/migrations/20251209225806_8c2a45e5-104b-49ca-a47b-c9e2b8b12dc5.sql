-- Create a table for storing market/customer information
CREATE TABLE public.markets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  trader_category TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  zone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

-- Create policies for market access
CREATE POLICY "Anyone authenticated can view markets" 
ON public.markets 
FOR SELECT 
USING (true);

CREATE POLICY "Admins and storekeepers can insert markets" 
ON public.markets 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'storekeeper'::app_role));

CREATE POLICY "Admins and storekeepers can update markets" 
ON public.markets 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'storekeeper'::app_role));

CREATE POLICY "Admins can delete markets" 
ON public.markets 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_markets_updated_at
BEFORE UPDATE ON public.markets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Add 'mandwb' role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mandwb';

-- Create delivery persons (mandwb) table
CREATE TABLE public.delivery_persons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create market assignments table (which markets each mandwb is responsible for)
CREATE TABLE public.market_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_person_id UUID NOT NULL REFERENCES public.delivery_persons(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(delivery_person_id, market_id)
);

-- Create market visits table (when mandwb visits a market and reports)
CREATE TABLE public.market_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_person_id UUID NOT NULL REFERENCES public.delivery_persons(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, resolved
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create visit items table (items reported during visit)
CREATE TABLE public.visit_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID NOT NULL REFERENCES public.market_visits(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  issue_type TEXT NOT NULL, -- expired, expiring, damaged
  action_taken TEXT, -- removed, renewed, pending
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_items ENABLE ROW LEVEL SECURITY;

-- RLS for delivery_persons
CREATE POLICY "Admins can manage delivery persons" ON public.delivery_persons
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Mandwb can view own profile" ON public.delivery_persons
  FOR SELECT USING (user_id = auth.uid());

-- RLS for market_assignments
CREATE POLICY "Admins can manage market assignments" ON public.market_assignments
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Mandwb can view own assignments" ON public.market_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.delivery_persons dp
      WHERE dp.id = market_assignments.delivery_person_id
      AND dp.user_id = auth.uid()
    )
  );

-- RLS for market_visits
CREATE POLICY "Admins can manage all visits" ON public.market_visits
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Mandwb can view and create own visits" ON public.market_visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.delivery_persons dp
      WHERE dp.id = market_visits.delivery_person_id
      AND dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Mandwb can insert own visits" ON public.market_visits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.delivery_persons dp
      WHERE dp.id = market_visits.delivery_person_id
      AND dp.user_id = auth.uid()
    )
  );

-- RLS for visit_items
CREATE POLICY "Admins can manage all visit items" ON public.visit_items
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Mandwb can view own visit items" ON public.visit_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.market_visits mv
      JOIN public.delivery_persons dp ON dp.id = mv.delivery_person_id
      WHERE mv.id = visit_items.visit_id
      AND dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Mandwb can insert own visit items" ON public.visit_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.market_visits mv
      JOIN public.delivery_persons dp ON dp.id = mv.delivery_person_id
      WHERE mv.id = visit_items.visit_id
      AND dp.user_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_delivery_persons_updated_at
  BEFORE UPDATE ON public.delivery_persons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visit_items_updated_at
  BEFORE UPDATE ON public.visit_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
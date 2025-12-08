-- Create profiles table for users
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'storekeeper', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Trigger for new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view categories" 
ON public.categories FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and storekeepers can insert categories" 
ON public.categories FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins and storekeepers can update categories" 
ON public.categories FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Admins can delete categories" 
ON public.categories FOR DELETE 
TO authenticated
USING (true);

-- Create brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view brands" 
ON public.brands FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and storekeepers can insert brands" 
ON public.brands FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins and storekeepers can update brands" 
ON public.brands FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Admins can delete brands" 
ON public.brands FOR DELETE 
TO authenticated
USING (true);

-- Create items table
CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  unit TEXT NOT NULL DEFAULT 'دانە',
  current_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 10,
  date_added TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  mfg_date DATE,
  exp_date DATE,
  remind_date DATE,
  image_url TEXT,
  total_in INTEGER NOT NULL DEFAULT 0,
  total_out INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view items" 
ON public.items FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and storekeepers can insert items" 
ON public.items FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins and storekeepers can update items" 
ON public.items FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Admins can delete items" 
ON public.items FOR DELETE 
TO authenticated
USING (true);

-- Create stock_movements table
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUST')),
  quantity INTEGER NOT NULL,
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view stock movements" 
ON public.stock_movements FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and storekeepers can insert stock movements" 
ON public.stock_movements FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Function to update item quantity after stock movement
CREATE OR REPLACE FUNCTION public.update_item_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.movement_type = 'IN' THEN
    UPDATE public.items 
    SET current_quantity = current_quantity + NEW.quantity,
        total_in = total_in + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.item_id;
  ELSIF NEW.movement_type = 'OUT' THEN
    UPDATE public.items 
    SET current_quantity = current_quantity - NEW.quantity,
        total_out = total_out + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.item_id;
  ELSIF NEW.movement_type = 'ADJUST' THEN
    UPDATE public.items 
    SET current_quantity = NEW.quantity,
        updated_at = now()
    WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_stock_movement_insert
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_item_quantity();

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name) VALUES 
  ('شیری مندال'),
  ('خواردنەوە'),
  ('پاککەرەوە'),
  ('حەلوێک'),
  ('دەرمان'),
  ('خۆراکی تایبەت');

-- Insert default brands
INSERT INTO public.brands (name) VALUES 
  ('نستلە'),
  ('جونسن'),
  ('پامپرس'),
  ('ھیرۆ'),
  ('سیمیلاک');
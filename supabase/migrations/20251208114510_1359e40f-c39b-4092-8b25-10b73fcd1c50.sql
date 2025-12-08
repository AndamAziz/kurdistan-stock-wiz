
-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'storekeeper', 'viewer');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Anyone authenticated can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Remove role column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Update brands table policies to use has_role function
DROP POLICY IF EXISTS "Admins and storekeepers can insert brands" ON public.brands;
DROP POLICY IF EXISTS "Admins and storekeepers can update brands" ON public.brands;
DROP POLICY IF EXISTS "Admins can delete brands" ON public.brands;

CREATE POLICY "Admins and storekeepers can insert brands"
ON public.brands
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'storekeeper'));

CREATE POLICY "Admins and storekeepers can update brands"
ON public.brands
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'storekeeper'));

CREATE POLICY "Admins can delete brands"
ON public.brands
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update categories table policies
DROP POLICY IF EXISTS "Admins and storekeepers can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins and storekeepers can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

CREATE POLICY "Admins and storekeepers can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'storekeeper'));

CREATE POLICY "Admins and storekeepers can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'storekeeper'));

CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update items table policies
DROP POLICY IF EXISTS "Admins and storekeepers can insert items" ON public.items;
DROP POLICY IF EXISTS "Admins and storekeepers can update items" ON public.items;
DROP POLICY IF EXISTS "Admins can delete items" ON public.items;

CREATE POLICY "Admins and storekeepers can insert items"
ON public.items
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'storekeeper'));

CREATE POLICY "Admins and storekeepers can update items"
ON public.items
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'storekeeper'));

CREATE POLICY "Admins can delete items"
ON public.items
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update stock_movements table policies
DROP POLICY IF EXISTS "Admins and storekeepers can insert stock movements" ON public.stock_movements;

CREATE POLICY "Admins and storekeepers can insert stock movements"
ON public.stock_movements
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'storekeeper'));

-- Phase 1: Fix Critical RLS Policy Issues

-- 1. Update profiles SELECT policy - users can only view their own profile
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Update user_roles SELECT policy - users see own roles, admins see all
DROP POLICY IF EXISTS "Anyone authenticated can view roles" ON public.user_roles;
CREATE POLICY "Users can view own roles or admins can view all" 
ON public.user_roles 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Phase 2: Add Missing Policies

-- 3. Add DELETE policy to profiles table (GDPR compliance)
CREATE POLICY "Users can delete their own profile or admins can delete any" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));

-- 4. Add UPDATE and DELETE policies to stock_movements (admin only)
CREATE POLICY "Admins can update stock movements" 
ON public.stock_movements 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete stock movements" 
ON public.stock_movements 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));
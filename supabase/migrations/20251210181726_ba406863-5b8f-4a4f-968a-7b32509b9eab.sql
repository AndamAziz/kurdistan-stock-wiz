-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage delivery persons" ON public.delivery_persons;
DROP POLICY IF EXISTS "Mandwb can view own profile" ON public.delivery_persons;

-- Create PERMISSIVE policies (OR logic) for proper access
CREATE POLICY "Admins can manage delivery persons" 
ON public.delivery_persons 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Mandwb can view own profile" 
ON public.delivery_persons 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());
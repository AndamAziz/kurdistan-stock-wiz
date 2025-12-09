-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Anyone authenticated can view markets" ON public.markets;

-- Create a PERMISSIVE SELECT policy for authenticated users
CREATE POLICY "Anyone authenticated can view markets" 
ON public.markets 
FOR SELECT 
TO authenticated
USING (true);
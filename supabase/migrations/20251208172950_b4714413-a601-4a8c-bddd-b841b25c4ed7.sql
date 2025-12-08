-- Fix DELETE policy to use TO authenticated instead of TO public
DROP POLICY IF EXISTS "Users can delete their own profile or admins can delete any" ON profiles;
CREATE POLICY "Users can delete their own profile or admins can delete any" ON profiles
  FOR DELETE TO authenticated
  USING ((auth.uid() = id) OR has_role(auth.uid(), 'admin'::app_role));

-- Add SELECT policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
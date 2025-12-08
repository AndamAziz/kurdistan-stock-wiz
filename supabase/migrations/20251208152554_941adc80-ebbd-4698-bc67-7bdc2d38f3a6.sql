-- Fix: Restrict stock_movements SELECT access to admin and storekeeper roles only
-- This prevents viewers from seeing sensitive financial/pricing data

DROP POLICY IF EXISTS "Anyone authenticated can view stock movements" ON stock_movements;

CREATE POLICY "Admins and storekeepers can view stock movements"
ON stock_movements FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'storekeeper'::app_role));
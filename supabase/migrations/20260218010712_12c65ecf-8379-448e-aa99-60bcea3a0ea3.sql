-- Add RLS policies for telegram_subscribers table
-- Admins can manage all telegram subscribers
CREATE POLICY "Admins can manage telegram subscribers"
ON public.telegram_subscribers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
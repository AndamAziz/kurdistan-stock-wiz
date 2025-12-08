-- Create storage bucket for item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true);

-- Create RLS policies for item-images bucket
-- Anyone authenticated can view images
CREATE POLICY "Anyone can view item images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'item-images');

-- Admins and storekeepers can upload images
CREATE POLICY "Admins and storekeepers can upload item images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'item-images' 
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) 
    OR public.has_role(auth.uid(), 'storekeeper'::public.app_role)
  )
);

-- Admins and storekeepers can update images
CREATE POLICY "Admins and storekeepers can update item images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'item-images' 
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) 
    OR public.has_role(auth.uid(), 'storekeeper'::public.app_role)
  )
);

-- Admins can delete images
CREATE POLICY "Admins can delete item images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'item-images' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
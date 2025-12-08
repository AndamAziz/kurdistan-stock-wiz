-- Add pricing columns to items table
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS box_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS piece_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_per_kg numeric DEFAULT 0;
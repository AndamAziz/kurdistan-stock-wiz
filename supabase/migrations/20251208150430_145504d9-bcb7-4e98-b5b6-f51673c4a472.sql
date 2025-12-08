-- Add price column to stock_movements table for tracking purchase/sale prices
ALTER TABLE public.stock_movements 
ADD COLUMN price numeric DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.stock_movements.price IS 'Price per unit for this movement (purchase price for IN, sale price for OUT)';
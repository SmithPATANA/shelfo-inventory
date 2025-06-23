-- Add discount column to sales table
ALTER TABLE public.sales
ADD COLUMN discount DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Optional: Update existing sales records to have a default discount of 0
-- This is good practice if there's existing data.
UPDATE public.sales
SET discount = 0
WHERE discount IS NULL; 
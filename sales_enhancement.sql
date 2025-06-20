-- Sales Enhancement SQL
-- Run this in your Supabase SQL editor to enhance sales functionality

-- 1. Create a function to automatically calculate total_amount
CREATE OR REPLACE FUNCTION calculate_sale_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total amount based on product selling price and quantity
  SELECT selling_price * NEW.quantity INTO NEW.total_amount
  FROM products
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger to automatically calculate total_amount before insert
DROP TRIGGER IF EXISTS calculate_sale_total_trigger ON sales;
CREATE TRIGGER calculate_sale_total_trigger
  BEFORE INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION calculate_sale_total();

-- 3. Create trigger to automatically calculate total_amount before update
DROP TRIGGER IF EXISTS calculate_sale_total_update_trigger ON sales;
CREATE TRIGGER calculate_sale_total_update_trigger
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION calculate_sale_total();

-- 4. Create a function to update product quantity after sale
CREATE OR REPLACE FUNCTION update_product_quantity_after_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product quantity by subtracting sold quantity
  UPDATE products 
  SET quantity = quantity - NEW.quantity
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to automatically update product quantity after sale
DROP TRIGGER IF EXISTS update_product_quantity_trigger ON sales;
CREATE TRIGGER update_product_quantity_trigger
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_product_quantity_after_sale();

-- 6. Create a function to validate sale quantity
CREATE OR REPLACE FUNCTION validate_sale_quantity()
RETURNS TRIGGER AS $$
DECLARE
  available_quantity INTEGER;
BEGIN
  -- Get available quantity for the product
  SELECT quantity INTO available_quantity
  FROM products
  WHERE id = NEW.product_id;
  
  -- Check if requested quantity is available
  IF NEW.quantity > available_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', available_quantity, NEW.quantity;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to validate sale quantity before insert
DROP TRIGGER IF EXISTS validate_sale_quantity_trigger ON sales;
CREATE TRIGGER validate_sale_quantity_trigger
  BEFORE INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION validate_sale_quantity();

-- 8. Create a view for sales analytics
DROP VIEW IF EXISTS sales_analytics;
CREATE VIEW sales_analytics AS
SELECT 
  s.id,
  s.created_at,
  s.quantity,
  s.total_amount,
  s.notes,
  p.name as product_name,
  p.type as product_type,
  p.selling_price as unit_price,
  u.email as user_email,
  EXTRACT(YEAR FROM s.created_at) as sale_year,
  EXTRACT(MONTH FROM s.created_at) as sale_month,
  EXTRACT(DAY FROM s.created_at) as sale_day,
  EXTRACT(DOW FROM s.created_at) as sale_day_of_week
FROM sales s
JOIN products p ON s.product_id = p.id
JOIN auth.users u ON s.user_id = u.id;

-- 9. Create indexes for better performance on sales queries
CREATE INDEX IF NOT EXISTS sales_created_at_date_idx ON sales (DATE(created_at));
CREATE INDEX IF NOT EXISTS sales_user_created_idx ON sales (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sales_product_created_idx ON sales (product_id, created_at DESC);

-- 10. Create a function to get sales summary for a user
CREATE OR REPLACE FUNCTION get_user_sales_summary(user_uuid UUID, start_date TIMESTAMP DEFAULT NULL, end_date TIMESTAMP DEFAULT NULL)
RETURNS TABLE (
  total_sales INTEGER,
  total_revenue DECIMAL(10,2),
  total_quantity INTEGER,
  avg_sale_amount DECIMAL(10,2),
  most_sold_product TEXT,
  most_sold_quantity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH sales_data AS (
    SELECT 
      s.*,
      p.name as product_name
    FROM sales s
    JOIN products p ON s.product_id = p.id
    WHERE s.user_id = user_uuid
      AND (start_date IS NULL OR s.created_at >= start_date)
      AND (end_date IS NULL OR s.created_at <= end_date)
  ),
  product_totals AS (
    SELECT 
      product_name,
      SUM(quantity) as total_quantity
    FROM sales_data
    GROUP BY product_name
    ORDER BY total_quantity DESC
    LIMIT 1
  )
  SELECT 
    COUNT(*)::INTEGER as total_sales,
    COALESCE(SUM(total_amount), 0) as total_revenue,
    COALESCE(SUM(quantity), 0)::INTEGER as total_quantity,
    COALESCE(AVG(total_amount), 0) as avg_sale_amount,
    pt.product_name as most_sold_product,
    pt.total_quantity as most_sold_quantity
  FROM sales_data sd
  LEFT JOIN product_totals pt ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Grant necessary permissions
GRANT SELECT ON sales_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_sales_summary TO authenticated;

-- 12. Add comments for documentation
COMMENT ON TABLE sales IS 'Records of all sales transactions';
COMMENT ON COLUMN sales.total_amount IS 'Automatically calculated as product.selling_price * quantity';
COMMENT ON FUNCTION calculate_sale_total() IS 'Automatically calculates total_amount for sales';
COMMENT ON FUNCTION update_product_quantity_after_sale() IS 'Automatically updates product quantity after a sale';
COMMENT ON FUNCTION validate_sale_quantity() IS 'Validates that sale quantity does not exceed available stock';
COMMENT ON VIEW sales_analytics IS 'Comprehensive view for sales analytics and reporting';
COMMENT ON FUNCTION get_user_sales_summary() IS 'Returns sales summary statistics for a user within optional date range';

-- 13. Test the setup (optional - you can run this to verify everything works)
-- SELECT * FROM sales_analytics LIMIT 5;
-- SELECT * FROM get_user_sales_summary('your-user-id-here'); 
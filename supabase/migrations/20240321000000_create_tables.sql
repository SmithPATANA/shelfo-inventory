-- Create products table
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    purchase_price DECIMAL(10,2) NOT NULL CHECK (purchase_price >= 0),
    selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
    supplier TEXT NOT NULL,
    notes TEXT,
    image_url TEXT
);

-- Create sales table
CREATE TABLE sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    notes TEXT
);

-- Create indexes
CREATE INDEX products_user_id_idx ON products(user_id);
CREATE INDEX products_name_idx ON products(name);
CREATE INDEX products_type_idx ON products(type);
CREATE INDEX sales_user_id_idx ON sales(user_id);
CREATE INDEX sales_product_id_idx ON sales(product_id);
CREATE INDEX sales_created_at_idx ON sales(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create policies for products table
CREATE POLICY "Users can view their own products"
    ON products FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products"
    ON products FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
    ON products FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
    ON products FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for sales table
CREATE POLICY "Users can view their own sales"
    ON sales FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales"
    ON sales FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales"
    ON sales FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales"
    ON sales FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically set user_id
CREATE TRIGGER on_product_created
    BEFORE INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_sale_created
    BEFORE INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user(); 
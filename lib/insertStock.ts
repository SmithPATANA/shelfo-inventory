import { supabase, getCurrentUser } from '@/lib/supabase';

interface StockItem {
  product: string;
  quantity: number;
  unit_price: number;
  type?: string;
  supplier?: string;
  notes?: string | null;
}

export async function insertToSupabase(stockItems: StockItem[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  // Map stockItems to match the products table schema
  const itemsToInsert = stockItems.map(item => ({
    name: item.product,
    quantity: item.quantity,
    selling_price: item.unit_price,
    purchase_price: item.unit_price, // or set to 0 or another value if not available
    type: item.type || '', // optional, set as needed
    supplier: item.supplier || '', // optional, set as needed
    notes: item.notes || null,
    image_url: null,
    user_id: user.id,
  }));

  const { data, error } = await supabase
    .from('products')
    .insert(itemsToInsert);

  console.log('Insert payload:', itemsToInsert);
  console.log('Insert result:', { data, error });
  if (error) {
    console.error('Failed to insert stock items:', error);
    throw new Error('Insert failed');
  }

  return data;
} 
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ProductForm {
  supplier: string;
  productType: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  photo: File | null;
  notes: string;
  weight?: string;
  size?: string;
}

export default function ManualStockEntryPage() {
  const [formData, setFormData] = useState<ProductForm>({
    supplier: '',
    productType: '',
    productName: '',
    quantity: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    photo: null,
    notes: '',
    weight: '',
    size: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, photo: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Implement form submission
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-6 py-12 flex flex-col items-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Manual Stock Entry</h1>
          <p className="mb-6 text-gray-500 text-center">Fill in the form to add new stock manually.</p>
          <form onSubmit={handleSubmit} className="space-y-6 w-full">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">Supplier (Optional)</label>
                <input type="text" name="supplier" id="supplier" value={formData.supplier} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm text-gray-900" />
              </div>
              <div>
                <label htmlFor="productType" className="block text-sm font-medium text-gray-700">Product Type (Optional)</label>
                <input type="text" name="productType" id="productType" value={formData.productType} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm text-gray-900" />
              </div>
              <div>
                <label htmlFor="productName" className="block text-sm font-medium text-gray-700">Product Name <span className="text-red-500">*</span></label>
                <input type="text" name="productName" id="productName" required value={formData.productName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm text-gray-900" />
              </div>
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity <span className="text-red-500">*</span></label>
                <input type="number" name="quantity" id="quantity" required min="1" value={formData.quantity} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm text-gray-900" />
              </div>
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight (Optional)</label>
                <input type="text" name="weight" id="weight" value={formData.weight} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm text-gray-900" />
              </div>
              <div>
                <label htmlFor="size" className="block text-sm font-medium text-gray-700">Size (Optional)</label>
                <input type="text" name="size" id="size" value={formData.size} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm text-gray-900" />
              </div>
              <div>
                <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700">Purchase Price (Optional)</label>
                <input type="number" name="purchasePrice" id="purchasePrice" min="0" step="0.01" value={formData.purchasePrice} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm text-gray-900" />
              </div>
              <div>
                <label htmlFor="sellingPrice" className="block text-sm font-medium text-gray-700">Selling Price (Optional)</label>
                <input type="number" name="sellingPrice" id="sellingPrice" min="0" step="0.01" value={formData.sellingPrice} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm text-gray-900" />
              </div>
              <div>
                <label htmlFor="photo" className="block text-sm font-medium text-gray-700">Upload Photo (Optional)</label>
                <input type="file" name="photo" id="photo" onChange={handlePhotoChange} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#635bff] file:text-white hover:file:bg-[#4f46e5]" />
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                <textarea name="notes" id="notes" rows={3} value={formData.notes} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm text-gray-900" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                {loading ? 'Adding...' : 'Add Stock'}
              </button>
            </div>
          </form>
          <div className="mt-10 w-full flex justify-center">
            <Link href="/add-stock" className="inline-block px-6 py-2 rounded-md bg-purple-600 text-white font-medium shadow hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
              ← Back
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface ParsedProduct {
  supplier?: string;
  product_type?: string;
  name: string;
  quantity: number;
  weight?: string;
  size?: string;
  purchase_price?: number;
  selling_price?: number;
  notes?: string;
}

export default function SnapAndStockPage() {
  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  const [extractedText, setExtractedText] = useState<string>('');

  // Step 1: Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setError(null);
    if (file) {
      // Show file name for preview
      setFilePreview(file.name);
    } else {
      setFilePreview(null);
    }
  };

  // Step 2: Upload document and extract text
  const handleUploadDocument = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setToast(null);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch('/api/document-parse', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload document');
      const data = await response.json();
      
      if (!data.text || data.text.trim() === '') {
        setError('No text could be extracted from the document. Please try a clearer image or different document.');
        return;
      }
      setExtractedText(data.text);
      if (data.products && Array.isArray(data.products) && data.products.length > 0) {
        setParsedProducts(data.products);
        setStep(3); // Go directly to review step
      } else {
        setError('No products detected in the document. Please try again with a different document.');
      }
    } catch (_) {
      setError('Failed to process document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Handle product edits
  const handleProductChange = (idx: number, field: keyof ParsedProduct, value: string | number) => {
    setParsedProducts(products => products.map((p, i) => i === idx ? { ...p, [field]: value } : p));
    setFieldErrors(errors => ({ ...errors, [idx]: '' }));
  };

  // Step 5: Validate and submit all to inventory
  const handleSubmitAll = async () => {
    setLoading(true);
    setError(null);
    setToast(null);
    setFieldErrors({});
    
    // Validate fields
    let hasError = false;
    const newFieldErrors: Record<number, string> = {};
    parsedProducts.forEach((item, idx) => {
      if (!item.name || item.name.trim() === '') {
        newFieldErrors[idx] = 'Product name is required.';
        hasError = true;
      } else if (!item.quantity || item.quantity <= 0) {
        newFieldErrors[idx] = 'Quantity must be a positive number.';
        hasError = true;
      } else if ((item.purchase_price ?? 0) < 0 || (item.selling_price ?? 0) < 0) {
        newFieldErrors[idx] = 'Prices must be positive numbers.';
        hasError = true;
      }
    });
    
    if (hasError) {
      setFieldErrors(newFieldErrors);
      setLoading(false);
      setToast('Please fix the errors in the highlighted products.');
      return;
    }
    
    try {
      // Get user_id from Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (!userId) throw new Error('User not authenticated');
      
      // Prepare items for insert
      const items = parsedProducts.map(item => ({
        name: item.name,
        quantity: item.quantity,
        selling_price: item.selling_price ?? 0,
        purchase_price: item.purchase_price ?? 0,
        supplier: item.supplier || '',
        product_type: item.product_type || '',
        weight: item.weight || null,
        size: item.size || null,
        notes: item.notes || '',
        user_id: userId,
      }));
      
      const { error } = await supabase.from('products').insert(items);
      if (error) throw error;
      
      setToast('Stock added successfully!');
      setStep(4);
    } catch (_) {
      setError('Failed to add items to inventory.');
      setToast('Failed to add items to inventory.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 flex flex-col items-center justify-center">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-[#635bff] mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-gray-700 font-medium">Processing...</span>
          </div>
        </div>
      )}
      
      {toast && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#635bff] text-white px-6 py-3 rounded shadow-lg font-semibold text-base animate-fade-in-out">
          {toast}
        </div>
      )}
      
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-6 py-8 flex flex-col items-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Smart Stock Entry (AI Powered)</h1>
          <div className="mb-6 flex gap-2 items-center justify-center">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${step === 1 ? 'bg-[#635bff] text-white' : 'bg-gray-200 text-gray-700'}`}>1️⃣ Upload File</span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${step === 2 ? 'bg-[#635bff] text-white' : 'bg-gray-200 text-gray-700'}`}>2️⃣ AI Reads</span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${step === 3 ? 'bg-[#635bff] text-white' : 'bg-gray-200 text-gray-700'}`}>3️⃣ Review & Edit</span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${step === 4 ? 'bg-[#635bff] text-white' : 'bg-gray-200 text-gray-700'}`}>4️⃣ Success!</span>
          </div>
          
          {step === 1 && (
            <>
              <p className="mb-4 text-lg font-semibold text-[#635bff] bg-[#f5f3ff] px-4 py-3 rounded-lg shadow-sm border border-[#e0e7ff] text-center">
                AI will capture your stock details from your document
              </p>
              <input type="file" name="file" accept=".pdf,.docx,.jpg,.jpeg,.png,.tiff,.bmp" className="hidden" id="document-upload" onChange={handleFileChange} />
              <div className="flex gap-4 mb-4">
                <button type="button" className="py-3 px-6 rounded-lg bg-[#635bff] text-white font-semibold text-lg shadow hover:bg-[#4f46e5] flex items-center gap-2" onClick={() => document.getElementById('document-upload')?.click()}>
                  <span>🤖</span> Upload & Let AI Read
                </button>
              </div>
              
              {filePreview && (
                <div className="w-full max-w-xs mx-auto p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">File Ready for AI Magic:</p>
                    <p className="font-medium text-gray-800">{filePreview}</p>
                  </div>
                  <button
                    type="button"
                    className="ml-4 text-red-500 hover:text-red-700 text-xl"
                    aria-label="Remove file"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    title="Remove file"
                  >
                    ❌
                  </button>
                </div>
              )}
              
              {selectedFile && (
                <button type="button" className="w-full py-3 px-4 rounded-lg bg-green-600 text-white font-semibold text-lg shadow hover:bg-green-700 mb-2" onClick={handleUploadDocument} disabled={loading}>
                  {loading ? 'Processing...' : '✨ Scan with AI ✨'}
                </button>
              )}
            </>
          )}
          
          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">Text Extraction Complete</h2>
              <div className="w-full mb-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{extractedText}</p>
                </div>
              </div>
            </>
          )}
          
          {step === 3 && (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">Review & Edit Items</h2>
              <div className="space-y-4 w-full mb-4">
                {parsedProducts.map((item, idx) => (
                  <div key={idx} className={`p-4 bg-gray-50 rounded-lg border ${fieldErrors[idx] ? 'border-red-400' : 'border-gray-200'} flex flex-col gap-2`}>
                    <input type="text" className="w-full rounded border border-gray-300 p-2 text-sm" value={item.name} onChange={e => handleProductChange(idx, 'name', e.target.value)} placeholder="Product Name" />
                    <input type="number" className="w-full rounded border border-gray-300 p-2 text-sm" value={item.quantity} min={1} onChange={e => handleProductChange(idx, 'quantity', Number(e.target.value))} placeholder="Quantity" />
                    <input type="text" className="w-full rounded border border-gray-300 p-2 text-sm" value={item.supplier || ''} onChange={e => handleProductChange(idx, 'supplier', e.target.value)} placeholder="Supplier (optional)" />
                    <input type="text" className="w-full rounded border border-gray-300 p-2 text-sm" value={item.product_type || ''} onChange={e => handleProductChange(idx, 'product_type', e.target.value)} placeholder="Product Type (optional)" />
                    <input type="text" className="w-full rounded border border-gray-300 p-2 text-sm" value={item.weight || ''} onChange={e => handleProductChange(idx, 'weight', e.target.value)} placeholder="Weight (optional)" />
                    <input type="text" className="w-full rounded border border-gray-300 p-2 text-sm" value={item.size || ''} onChange={e => handleProductChange(idx, 'size', e.target.value)} placeholder="Size (optional)" />
                    <input type="number" className="w-full rounded border border-gray-300 p-2 text-sm" value={item.purchase_price ?? ''} min={0} step={0.01} onChange={e => handleProductChange(idx, 'purchase_price', Number(e.target.value))} placeholder="Purchase Price (optional)" />
                    <input type="number" className="w-full rounded border border-gray-300 p-2 text-sm" value={item.selling_price ?? ''} min={0} step={0.01} onChange={e => handleProductChange(idx, 'selling_price', Number(e.target.value))} placeholder="Selling Price (optional)" />
                    <input type="text" className="w-full rounded border border-gray-300 p-2 text-sm" value={item.notes || ''} onChange={e => handleProductChange(idx, 'notes', e.target.value)} placeholder="Notes (optional)" />
                    {fieldErrors[idx] && <div className="text-red-600 text-xs mt-1">{fieldErrors[idx]}</div>}
                  </div>
                ))}
              </div>
              <button type="button" className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-[#635bff] to-[#4f46e5] text-white font-semibold text-lg shadow hover:from-[#4f46e5] hover:to-[#4338ca] mb-2" onClick={handleSubmitAll} disabled={loading}>
                {loading ? 'Adding...' : 'Add All to Inventory'}
              </button>
            </>
          )}
          
          {step === 4 && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-green-600 mb-4">Stock Added!</h2>
              <p className="text-gray-700 mb-6">All items have been added to your inventory.</p>
              <Link href="/dashboard/inventory" className="inline-block px-6 py-2 rounded-md bg-green-600 text-white font-medium shadow hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                Go to Inventory
              </Link>
            </div>
          )}
          
          {error && <div className="w-full p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm text-center mt-4">{error}</div>}
          
          <div className="mt-8 w-full flex justify-center">
            <Link href="/add-stock" className="inline-block px-6 py-2 rounded-md bg-purple-600 text-white font-medium shadow hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
              ← Back
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 
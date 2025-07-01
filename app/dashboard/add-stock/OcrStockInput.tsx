import { useState, useRef } from 'react';
// import { extractTextFromImage } from '@/lib/visionHelper'; // No longer needed on client
import { insertToSupabase } from '@/lib/insertStock';

interface StockItem {
  name: string | null;
  type: string | null;
  quantity: number | null;
  purchase_price: number | null;
  selling_price: number | null;
  supplier: string | null;
  notes: string | null;
  weight: string | null;
  size: string | null;
  product: string;
  unit_price: number;
}

export default function OcrStockInput({ onSuccess }: { onSuccess?: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<StockItem[]>([]);
  /*
    PRESERVED FOR GOOGLE OCR FALLBACK
    const [loading, setLoading] = useState(false);
    const [parsing, setParsing] = useState(false);
  */
  const [inserting, setInserting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inline edit handlers
  const handleItemChange = (index: number, field: keyof StockItem, value: string | number) => {
    setParsedItems(items => items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setExtractedText('');
    setParsedItems([]);
    setError(null);
    setSuccess(null);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  /*
    PRESERVED FOR GOOGLE OCR FALLBACK
    const handleExtractText = async () => {
      if (!selectedFile) return;
      setLoading(true);
      setExtractedText('');
      setParsedItems([]);
      setError(null);
      setSuccess(null);
      try {
        // Upload file to /api/ocr-upload
        const formData = new FormData();
        formData.append('file', selectedFile);
        const response = await fetch('/api/ocr-upload', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error('Failed to extract text');
        const data = await response.json();
        setExtractedText(data.text || '');
      } catch (err) {
        console.error('Error extracting text:', err);
        setError('Failed to extract text. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const handleParseText = async () => {
      if (!extractedText) return;
      setParsing(true);
      setError(null);
      setSuccess(null);
      try {
        const response = await fetch('/api/parse-ocr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rawText: extractedText }),
        });
        if (!response.ok) throw new Error('Failed to parse text');
        const data = await response.json();
        setParsedItems(data.products || []);
      } catch (err) {
        console.error('Error parsing text:', err);
        setError('Failed to parse text. Please try again.');
      } finally {
        setParsing(false);
      }
    };
  */

  const handleInsertToInventory = async () => {
    if (!parsedItems.length) return;
    setInserting(true);
    setError(null);
    setSuccess(null);
    try {
      // Get user_id from Supabase Auth (correct destructuring)
      const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
      const userId = session?.user.id;
      if (!userId) throw new Error('User not authenticated');
      // Map fields to match Supabase schema
      const items = parsedItems.map(item => ({
        name: item.name || '',
        type: item.type || '',
        quantity: Number(item.quantity),
        purchase_price: Number(item.purchase_price),
        selling_price: Number(item.selling_price),
        supplier: item.supplier || '',
        notes: item.notes || '',
        weight: item.weight || null,
        size: item.size || null,
        user_id: userId,
        product: item.product,
        unit_price: Number(item.unit_price),
        // image_url can be added if available
      }));
      await insertToSupabase(items);
      setSuccess(`Added ${items.length} item(s) to inventory!`);
      setSelectedFile(null);
      setImagePreview(null);
      setExtractedText('');
      setParsedItems([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error inserting to inventory:', err);
      setError('Failed to insert items into inventory. Please try again.');
    } finally {
      setInserting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mb-6 p-4 bg-white rounded-lg shadow-sm flex flex-col gap-4">
      <label className="block text-base font-semibold text-gray-800 mb-1 text-center">Add Stock from Photo/Receipt</label>
      
      {/* Camera input */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        capture="environment"
      />
      
      {/* Gallery input */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="gallery-input"
        onChange={handleFileChange}
      />
      
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 py-3 px-4 rounded-lg bg-[#635bff] text-white font-semibold text-sm shadow hover:bg-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635bff] transition-all"
          onClick={() => fileInputRef.current?.click()}
        >
          📷 Take Photo
        </button>
        <button
          type="button"
          className="flex-1 py-3 px-4 rounded-lg bg-green-600 text-white font-semibold text-sm shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-all"
          onClick={() => document.getElementById('gallery-input')?.click()}
        >
          📁 Upload from Gallery
        </button>
      </div>
      
      {selectedFile && (
        <button
          type="button"
          className="w-full py-2 px-4 rounded-lg bg-gray-500 text-white font-semibold text-sm shadow hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
          onClick={() => {
            setSelectedFile(null);
            setImagePreview(null);
            setExtractedText('');
            setParsedItems([]);
            setError(null);
            setSuccess(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (document.getElementById('gallery-input') as HTMLInputElement) {
              (document.getElementById('gallery-input') as HTMLInputElement).value = '';
            }
          }}
        >
          ✕ Clear Selection
        </button>
      )}
      {imagePreview && (
        <img
          src={imagePreview}
          alt="Preview"
          className="w-full max-w-xs mx-auto rounded-lg border border-gray-200 object-contain"
        />
      )}
      {/* Google OCR + GPT functionality - DISABLED when USE_GPT_VISION=true */}
      {/* 
      {selectedFile && !loading && !extractedText && (
        <button
          type="button"
          className="w-full py-3 px-4 rounded-lg bg-green-600 text-white font-semibold text-base shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-all"
          onClick={handleExtractText}
        >
          Extract Text
        </button>
      )}
      {loading && (
        <div className="flex flex-col items-center w-full py-4">
          <svg className="animate-spin h-8 w-8 text-[#635bff] mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-500">Extracting text...</span>
        </div>
      )}
      {extractedText && (
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">Extracted Text</label>
          <textarea
            className="w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 bg-gray-50 resize-none"
            rows={3}
            value={extractedText}
            readOnly
          />
          {!parsing && !parsedItems.length && (
            <button
              type="button"
              className="w-full mt-3 py-3 px-4 rounded-lg bg-blue-600 text-white font-semibold text-base shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all"
              onClick={handleParseText}
            >
              Parse with AI
            </button>
          )}
          {parsing && (
            <div className="flex flex-col items-center w-full py-4">
              <svg className="animate-spin h-8 w-8 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-gray-500">Parsing with AI...</span>
            </div>
          )}
        </div>
      )}
      */}
      {error && (
        <div className="w-full p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm text-center">{error}</div>
      )}
      {success && (
        <div className="w-full p-3 bg-green-50 border border-green-200 rounded text-green-600 text-sm text-center">{success}</div>
      )}
      {parsedItems.length > 0 && (
        <div className="w-full flex flex-col flex-1 justify-between">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Review & Edit Items</label>
          <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
            {parsedItems.map((item, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-col gap-2">
                <input
                  type="text"
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                  value={item.name || ''}
                  onChange={e => handleItemChange(idx, 'name', e.target.value)}
                  placeholder="Product Name"
                />
                <input
                  type="text"
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                  value={item.type || ''}
                  onChange={e => handleItemChange(idx, 'type', e.target.value)}
                  placeholder="Product Type"
                />
                <input
                  type="number"
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                  value={item.quantity ?? ''}
                  min={1}
                  onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                  placeholder="Quantity"
                />
                <input
                  type="number"
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                  value={item.purchase_price ?? ''}
                  min={0}
                  step={0.01}
                  onChange={e => handleItemChange(idx, 'purchase_price', e.target.value)}
                  placeholder="Purchase Price"
                />
                <input
                  type="number"
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                  value={item.selling_price ?? ''}
                  min={0}
                  step={0.01}
                  onChange={e => handleItemChange(idx, 'selling_price', e.target.value)}
                  placeholder="Selling Price"
                />
                <input
                  type="text"
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                  value={item.supplier || ''}
                  onChange={e => handleItemChange(idx, 'supplier', e.target.value)}
                  placeholder="Supplier"
                />
                <input
                  type="text"
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                  value={item.notes || ''}
                  onChange={e => handleItemChange(idx, 'notes', e.target.value)}
                  placeholder="Notes (optional)"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="w-1/2 rounded border border-gray-300 p-2 text-sm"
                    value={item.weight || ''}
                    onChange={e => handleItemChange(idx, 'weight', e.target.value)}
                    placeholder="Weight (optional)"
                  />
                  <input
                    type="text"
                    className="w-1/2 rounded border border-gray-300 p-2 text-sm"
                    value={item.size || ''}
                    onChange={e => handleItemChange(idx, 'size', e.target.value)}
                    placeholder="Size (optional)"
                  />
                </div>
              </div>
            ))}
          </div>
          {!inserting && (
            <button
              type="button"
              className="w-full mt-3 py-3 px-4 rounded-md bg-gradient-to-r from-[#635bff] to-[#4f46e5] text-white font-semibold text-xs sm:text-base shadow hover:from-[#4f46e5] hover:to-[#4338ca] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635bff] transition-all"
              onClick={handleInsertToInventory}
            >
              Add All to Inventory
            </button>
          )}
          {inserting && (
            <div className="flex flex-col items-center w-full py-4">
              <svg className="animate-spin h-8 w-8 text-[#635bff] mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-gray-500">Adding to inventory...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
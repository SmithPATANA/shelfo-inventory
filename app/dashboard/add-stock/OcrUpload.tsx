import { useState, useRef } from 'react';
import { extractTextFromImage } from '@/lib/visionHelper';
import { insertToSupabase } from '@/lib/insertStock';

type StockItem = {
  product: string;
  quantity: number;
  unit_price: number;
};

export default function OcrUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [inserting, setInserting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExtractText = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setExtractedText('');
    setParsedItems([]);
    setError(null);
    setSuccess(null);
    try {
      const text = await extractTextFromImage(selectedFile);
      setExtractedText(text);
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
        body: JSON.stringify({ text: extractedText }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse text');
      }

      const data = await response.json();
      setParsedItems(data.items || []);
    } catch (err) {
      console.error('Error parsing text:', err);
      setError('Failed to parse text. Please try again.');
    } finally {
      setParsing(false);
    }
  };

  const handleInsertToInventory = async () => {
    if (!parsedItems.length) return;
    setInserting(true);
    setError(null);
    setSuccess(null);
    try {
      await insertToSupabase(parsedItems);
      setSuccess(`Successfully added ${parsedItems.length} item(s) to inventory!`);
      // Reset form
      setSelectedFile(null);
      setImagePreview(null);
      setExtractedText('');
      setParsedItems([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error inserting to inventory:', err);
      setError('Failed to insert items into inventory. Please try again.');
    } finally {
      setInserting(false);
    }
  };

  const handleCopy = () => {
    if (extractedText) {
      navigator.clipboard.writeText(extractedText);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <button
        type="button"
        className="w-full py-3 px-4 rounded-lg bg-[#635bff] text-white font-semibold text-base shadow hover:bg-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635bff] transition-all"
        onClick={() => fileInputRef.current?.click()}
      >
        {selectedFile ? 'Change Image' : 'Choose Image'}
      </button>
      
      {imagePreview && (
        <img
          src={imagePreview}
          alt="Preview"
          className="w-full max-w-xs rounded-lg border border-gray-200 object-contain"
        />
      )}
      
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
      
      {error && (
        <div className="w-full p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm text-center">{error}</div>
      )}
      
      {success && (
        <div className="w-full p-3 bg-green-50 border border-green-200 rounded text-green-600 text-sm text-center">{success}</div>
      )}
      
      {extractedText && (
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">Extracted Text</label>
          <div className="relative">
            <textarea
              className="w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 bg-gray-50 resize-none"
              rows={5}
              value={extractedText}
              readOnly
            />
            <button
              type="button"
              className="absolute top-2 right-2 px-3 py-1 bg-[#635bff] text-white rounded text-xs font-semibold shadow hover:bg-[#4f46e5] focus:outline-none"
              onClick={handleCopy}
            >
              Copy
            </button>
          </div>
          
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
      
      {parsedItems.length > 0 && (
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">Parsed Items ({parsedItems.length})</label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {parsedItems.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="font-medium text-gray-900">{item.product}</div>
                <div className="text-sm text-gray-600">
                  Qty: {item.quantity} | Price: ${item.unit_price}
                </div>
              </div>
            ))}
          </div>
          
          {!inserting && (
            <button
              type="button"
              className="w-full mt-3 py-3 px-4 rounded-lg bg-green-600 text-white font-semibold text-base shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-all"
              onClick={handleInsertToInventory}
            >
              Add to Inventory
            </button>
          )}
          
          {inserting && (
            <div className="flex flex-col items-center w-full py-4">
              <svg className="animate-spin h-8 w-8 text-green-600 mb-2" fill="none" viewBox="0 0 24 24">
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
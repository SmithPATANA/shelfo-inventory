import Link from 'next/link';

export default function AddStockLanding() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-6 py-12 flex flex-col items-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Add Stock</h1>
          <p className="mb-8 text-gray-500 text-center">How would you like to add new items to your inventory?</p>
          <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
            <Link href="/add-stock/snap" className="flex-1 py-8 px-6 rounded-xl bg-gradient-to-br from-[#635bff] to-[#4f46e5] text-white text-2xl font-semibold shadow-lg hover:from-[#4f46e5] hover:to-[#4338ca] transition-all text-center flex items-center justify-center">
              📷 Snap & Stock
            </Link>
            <Link href="/add-stock/manual" className="flex-1 py-8 px-6 rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-white text-2xl font-semibold shadow-lg hover:from-green-600 hover:to-green-800 transition-all text-center flex items-center justify-center">
              📝 Manual Stock Entry
            </Link>
          </div>
          <div className="mt-10 w-full flex justify-center">
            <Link href="/dashboard" className="inline-block px-6 py-2 rounded-md bg-purple-600 text-white font-medium shadow hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 
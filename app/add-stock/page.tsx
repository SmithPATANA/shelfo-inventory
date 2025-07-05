import Link from 'next/link';

export default function AddStockLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col items-center justify-center py-12">
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-8 lg:px-12">
        <div className="bg-white rounded-3xl shadow-2xl px-10 py-16 flex flex-col items-center border border-gray-100">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3 text-center tracking-tight drop-shadow-sm">Add Stock</h1>
          <p className="mb-10 text-lg text-gray-500 text-center font-medium">How would you like to add new items to your inventory?</p>
          <div className="flex flex-col sm:flex-row gap-8 w-full justify-center">
            <Link href="/add-stock/snap" className="flex-1 min-w-[240px] py-12 px-8 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white text-2xl font-bold shadow-xl hover:from-indigo-600 hover:to-blue-700 transition-all text-center flex items-center justify-center border-2 border-transparent hover:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-300/30">
              📄 Scan Document (AI-Powered)
            </Link>
            <Link href="/add-stock/manual" className="flex-1 min-w-[240px] py-12 px-8 rounded-2xl bg-gradient-to-br from-green-400 to-green-700 text-white text-2xl font-bold shadow-xl hover:from-green-600 hover:to-green-800 transition-all text-center flex items-center justify-center border-2 border-transparent hover:border-green-400 focus:outline-none focus:ring-4 focus:ring-green-300/30">
              📝 Manual Stock Entry
            </Link>
          </div>
          <div className="mt-12 w-full flex justify-center">
            <Link href="/dashboard" className="inline-block px-8 py-3 rounded-lg bg-purple-600 text-white text-lg font-semibold shadow hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 
import Link from 'next/link';

export default function AddStockLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col items-center justify-center py-6 sm:py-12">
      <div className="w-full max-w-md sm:max-w-4xl mx-auto px-2 sm:px-8 lg:px-12">
        <div className="bg-white rounded-3xl shadow-2xl px-4 py-8 sm:px-16 sm:py-16 flex flex-col items-center border border-gray-100">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 text-center tracking-tight drop-shadow-sm">Add Stock</h1>
          <p className="mb-8 sm:mb-10 text-base sm:text-lg text-gray-500 text-center font-medium">How would you like to add new items to your inventory?</p>
          <div className="flex flex-col gap-5 sm:flex-row sm:gap-10 w-full justify-center items-center">
            <Link href="/add-stock/snap" className="w-full sm:w-[370px] h-14 sm:h-20 px-4 sm:px-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white text-base sm:text-xl font-bold shadow-xl hover:from-indigo-600 hover:to-blue-700 transition-all text-center flex items-center justify-center border-2 border-transparent hover:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-300/30">
              📄 Scan Document (AI-Powered)
            </Link>
            <Link href="/add-stock/manual" className="w-full sm:w-[370px] h-14 sm:h-20 px-4 sm:px-10 rounded-2xl bg-gradient-to-br from-green-400 to-green-700 text-white text-base sm:text-xl font-bold shadow-xl hover:from-green-600 hover:to-green-800 transition-all text-center flex items-center justify-center border-2 border-transparent hover:border-green-400 focus:outline-none focus:ring-4 focus:ring-green-300/30">
              📝 Manual Stock Entry
            </Link>
          </div>
          <div className="mt-8 sm:mt-12 w-full flex justify-center">
            <Link href="/dashboard" className="inline-block w-full sm:w-auto px-6 py-3 rounded-lg bg-purple-600 text-white text-base sm:text-lg font-semibold shadow hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-center">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 
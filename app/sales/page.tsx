'use client'

import { useState } from 'react'

// Mock data for demonstration
const mockProducts = [
  { id: 1, name: 'Product 1', quantity: 50 },
  { id: 2, name: 'Product 2', quantity: 25 },
  // Add more mock products as needed
]

export default function SalesPage() {
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: Implement sales recording
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Record Sale</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="product" className="block text-sm font-medium text-gray-700">
                Product
              </label>
              <select
                id="product"
                name="product"
                required
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              >
                <option value="">Select a product</option>
                {mockProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Available: {product.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                Quantity Sold
              </label>
              <input
                type="number"
                name="quantity"
                id="quantity"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                {loading ? 'Recording...' : 'Record Sale'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 
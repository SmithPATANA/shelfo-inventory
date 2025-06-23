'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getCurrentUser } from '@/lib/supabase'

interface Product {
  id: string
  name: string
  type: string
  quantity: number
  selling_price: number
  purchase_price: number
  supplier: string
}

interface SaleForm {
  productId: string
  quantity: number
  notes: string
  discount: number
}

export default function SalesPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState<SaleForm>({
    productId: '',
    quantity: 1,
    notes: '',
    discount: 0
  })
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const user = await getCurrentUser()
      if (!user) {
        setError('User not authenticated')
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .gt('quantity', 0)
      if (error) throw error
      const validProducts = (data || []).filter((p): p is Product =>
        p && typeof p.id === 'string' && typeof p.name === 'string' && typeof p.type === 'string' && typeof p.quantity === 'number' && typeof p.selling_price === 'number' && typeof p.purchase_price === 'number' && typeof p.supplier === 'string'
      )
      setProducts(
        validProducts.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          quantity: p.quantity,
          selling_price: p.selling_price,
          purchase_price: p.purchase_price,
          supplier: p.supplier,
        }))
      )
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to fetch products')
      } else {
        setError('Failed to fetch products')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'discount' ? parseFloat(value) || 0 : value
    }))
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {}
    
    if (!formData.productId) {
      errors.productId = 'Please select a product'
    }
    
    if (formData.quantity < 1) {
      errors.quantity = 'Quantity must be at least 1'
    }
    
    const selectedProduct = products.find(p => p.id === formData.productId)
    if (selectedProduct && formData.quantity > selectedProduct.quantity) {
      errors.quantity = `Only ${selectedProduct.quantity} units available in stock`
    }
    
    if (formData.discount < 0) {
      errors.discount = 'Discount cannot be negative'
    }
    
    if (selectedProduct && formData.discount > selectedProduct.selling_price * formData.quantity) {
      errors.discount = `Discount cannot exceed total sale amount (KES ${(selectedProduct.selling_price * formData.quantity).toLocaleString()})`
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setError(null)
    setSuccess(null)
    setFormErrors({})
    
    // Validate form first
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)

    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')
      
      const selectedProduct = products.find((p) => p.id === formData.productId)
      if (!selectedProduct) throw new Error('No product selected')
      
      if (formData.quantity < 1 || formData.quantity > selectedProduct.quantity) {
        throw new Error(`Invalid quantity. Available: ${selectedProduct.quantity}, Requested: ${formData.quantity}`)
      }
      
      const totalAmount = selectedProduct.selling_price * formData.quantity - formData.discount
      
      // Validate discount doesn't exceed total
      if (formData.discount > selectedProduct.selling_price * formData.quantity) {
        throw new Error(`Discount cannot exceed total sale amount. Max discount: KES ${(selectedProduct.selling_price * formData.quantity).toLocaleString()}`)
      }

      console.log('Recording sale with data:', {
        user_id: user.id,
        product_id: selectedProduct.id,
        quantity: formData.quantity,
        total_amount: totalAmount,
        notes: formData.notes || null,
        discount: formData.discount,
      })

      // 1. Insert sale
      const { data: saleData, error: saleError } = await supabase.from('sales').insert([
        {
          user_id: user.id,
          product_id: selectedProduct.id,
          quantity: formData.quantity,
          total_amount: totalAmount,
          notes: formData.notes || null,
          discount: formData.discount,
        } as import('@/types/supabase').Database['public']['Tables']['sales']['Insert'],
      ])
      
      if (saleError) {
        console.error('Sale insert error:', saleError)
        throw new Error(`Failed to record sale: ${saleError.message || saleError.details || 'Unknown database error'}`)
      }

      console.log('Sale recorded successfully:', saleData)

      // 2. Update product quantity
      const { data: updateData, error: updateError } = await supabase.from('products')
        .update({ quantity: selectedProduct.quantity - formData.quantity } as import('@/types/supabase').Database['public']['Tables']['products']['Update'])
        .eq('id', selectedProduct.id)
        .select()
      
      if (updateError) {
        console.error('Product update error:', updateError)
        throw new Error(`Failed to update inventory: ${updateError.message || updateError.details || 'Unknown database error'}`)
      }

      console.log('Inventory updated successfully:', updateData)

      setSuccess('Sale recorded and inventory updated!')
      setTimeout(() => {
        router.push('/dashboard/inventory')
      }, 1200)
    } catch (err) {
      console.error('Sale recording error:', err)
      
      if (err instanceof Error) {
        setError(err.message)
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError(String(err.message))
      } else {
        setError(`Failed to record sale: ${String(err)}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedProduct = products.find(p => p.id === formData.productId)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-lg text-gray-600">Loading products...</span>
      </div>
    )
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sale Recording Failed</h3>
          <p className="text-sm text-red-600 mb-4 break-words">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setError(null)}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/dashboard/inventory')}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Inventory
            </button>
          </div>
        </div>
      </div>
    )
  }
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-lg text-green-600">{success}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-[#635bff] to-[#4f46e5] px-4 py-8 sm:px-6 sm:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">Record Sale</h1>
              <p className="mt-2 text-lg text-blue-100">Record a new sale and update inventory</p>
            </div>
            <div className="hidden sm:block">
              <svg className="w-16 h-16 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Form Validation Errors */}
          {Object.keys(formErrors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {Object.values(formErrors).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Product Selection */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2 sm:gap-0">
                <h2 className="text-xl font-semibold text-gray-900">Select Product</h2>
                <span className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-full">
                  {filteredProducts.length} products found
                </span>
              </div>
              {/* Search Input */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products by name, type, or supplier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 pl-12 pr-4 py-3 focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff] focus:ring-opacity-20 transition-all duration-200 text-sm sm:text-base"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Product List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 rounded-xl border transition-all duration-200 mb-2 ${
                      formData.productId === product.id
                        ? 'border-[#635bff] bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-[#635bff] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{product.type}</p>
                      {product.supplier && (
                        <p className="text-xs text-blue-600 mt-1 font-medium">
                          Supplier: {product.supplier}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 min-w-[120px] w-full sm:w-auto mt-2 sm:mt-0">
                      <span className="font-semibold text-gray-900">KES {product.selling_price.toLocaleString()}</span>
                      <span className="text-xs text-gray-500">{product.quantity} in stock</span>
                      <input
                        type="number"
                        min={1}
                        max={product.quantity}
                        value={formData.productId === product.id ? formData.quantity : ''}
                        onChange={e => {
                          setFormData({
                            productId: product.id,
                            quantity: Number(e.target.value),
                            notes: formData.notes,
                            discount: formData.discount
                          })
                        }}
                        placeholder="Qty"
                        className="w-full sm:w-16 rounded border border-gray-300 px-2 py-1 text-sm focus:border-[#635bff] focus:ring-1 focus:ring-[#635bff]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sale Details */}
          {selectedProduct && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Sale Details</h2>
                  <span className="px-3 py-1 text-sm font-medium text-green-600 bg-green-50 rounded-full">
                    Product Selected
                  </span>
                </div>
                
                <div className="space-y-6">
                  {/* Product Information */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{selectedProduct.name}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedProduct.type}</span>
                      </div>
                      {selectedProduct.supplier && (
                        <div>
                          <span className="text-gray-500">Supplier:</span>
                          <span className="ml-2 font-medium text-blue-600">{selectedProduct.supplier}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Unit Price:</span>
                        <span className="ml-2 font-medium text-gray-900">KES {selectedProduct.selling_price.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Available Stock:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedProduct.quantity} units</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity Sold
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        min="1"
                        max={selectedProduct.quantity}
                        value={formData.quantity}
                        onChange={handleChange}
                        className={`w-full rounded-xl border pl-4 pr-16 py-3 focus:ring-2 focus:ring-opacity-20 transition-all duration-200 ${
                          formErrors.quantity 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-200 focus:border-[#635bff] focus:ring-[#635bff]'
                        }`}
                        disabled={selectedProduct.quantity === 0}
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm font-medium">units</span>
                      </div>
                    </div>
                    {selectedProduct.quantity === 0 ? (
                      <p className="mt-2 text-sm text-red-600 font-semibold">Out of stock</p>
                    ) : formErrors.quantity ? (
                      <p className="mt-2 text-sm text-red-600">{formErrors.quantity}</p>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">
                        Available: {selectedProduct.quantity} units
                      </p>
                    )}
                  </div>

                  {/* Discount Input */}
                  <div>
                    <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Amount (KES)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="discount"
                        name="discount"
                        min="0"
                        max={selectedProduct.selling_price * formData.quantity}
                        value={formData.discount}
                        onChange={handleChange}
                        className={`w-full rounded-xl border pl-4 pr-16 py-3 focus:ring-2 focus:ring-opacity-20 transition-all duration-200 ${
                          formErrors.discount 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-200 focus:border-[#635bff] focus:ring-[#635bff]'
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm font-medium">KES</span>
                      </div>
                    </div>
                    {formErrors.discount && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.discount}</p>
                    )}
                  </div>

                  {/* Notes Input */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Sale Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="e.g., bought by loyal customer"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff] focus:ring-opacity-20 transition-all duration-200"
                    />
                  </div>

                  {/* Total Amount */}
                  <div className="pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-medium text-gray-700">Total Amount</span>
                      <span className="text-2xl font-bold text-gray-900">
                        KES {(selectedProduct.selling_price * formData.quantity - formData.discount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!formData.productId || isSubmitting || selectedProduct && selectedProduct.quantity === 0}
              className="px-8 py-3 bg-gradient-to-r from-[#635bff] to-[#4f46e5] text-white rounded-xl hover:from-[#4f46e5] hover:to-[#4338ca] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635bff] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </div>
              ) : (
                'Record Sale'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 
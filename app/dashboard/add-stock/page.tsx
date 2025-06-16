'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { handleSupabaseError } from '@/lib/supabase'

interface ProductForm {
  supplier: string
  productType: string
  productName: string
  quantity: number
  purchasePrice: number
  sellingPrice: number
  photo: File | null
  notes: string
}

export default function AddStockPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState<ProductForm>({
    supplier: '',
    productType: '',
    productName: '',
    quantity: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    photo: null,
    notes: ''
  })

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError
        
        if (!session) {
          router.push('/login')
          return
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Auth error:', error)
        router.push('/login')
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        photo: e.target.files![0]
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError
      if (!session) {
        router.push('/login')
        return
      }

      let image_url = null
      if (formData.photo) {
        const fileExt = formData.photo.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${session.user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, formData.photo)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        image_url = publicUrl
      }

      const { error: insertError } = await supabase
        .from('products')
        .insert({
          name: formData.productName,
          type: formData.productType,
          quantity: formData.quantity,
          purchase_price: formData.purchasePrice,
          selling_price: formData.sellingPrice,
          supplier: formData.supplier,
          notes: formData.notes || null,
          image_url: image_url,
          user_id: session.user.id
        })

      if (insertError) throw insertError

      router.push('/dashboard/inventory')
    } catch (error) {
      console.error('Error adding stock:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while adding stock')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#635bff] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add Stock</h1>
          <p className="mt-2 text-sm text-gray-600">Add new items to your inventory</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Supplier */}
              <div>
                <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                  Supplier (Optional)
                </label>
                <input
                  type="text"
                  id="supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  placeholder="e.g., Eastleigh Wholesalers, Gikomba Market, Kamukunji Traders"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#635bff] focus:ring-[#635bff] sm:text-sm"
                />
              </div>

              {/* Product Type */}
              <div>
                <label htmlFor="productType" className="block text-sm font-medium text-gray-700">
                  Product Type (Optional)
                </label>
                <input
                  type="text"
                  id="productType"
                  name="productType"
                  value={formData.productType}
                  onChange={handleChange}
                  placeholder="e.g., Ladies Suits, Men's Trousers, Ankara Dresses, School Uniforms"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#635bff] focus:ring-[#635bff] sm:text-sm"
                />
              </div>

              {/* Product Name */}
              <div>
                <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="productName"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Navy Blue Ladies Suit, Checked Men's Blazer, Ankara Maxi Dress"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#635bff] focus:ring-[#635bff] sm:text-sm"
                />
              </div>

              {/* Quantity */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    min="1"
                    step="1"
                    placeholder="e.g., 10"
                    className="block w-full rounded-md border-gray-300 pr-12 focus:border-[#635bff] focus:ring-[#635bff] sm:text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">units</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">Enter the number of units</p>
              </div>

              {/* Purchase Price */}
              <div>
                <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700">
                  Purchase Price (Optional)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">KES</span>
                  </div>
                  <input
                    type="number"
                    id="purchasePrice"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g., 2500.00"
                    className="block w-full rounded-md border-gray-300 pl-12 focus:border-[#635bff] focus:ring-[#635bff] sm:text-sm"
                  />
                </div>
              </div>

              {/* Selling Price */}
              <div>
                <label htmlFor="sellingPrice" className="block text-sm font-medium text-gray-700">
                  Selling Price (Optional)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">KES</span>
                  </div>
                  <input
                    type="number"
                    id="sellingPrice"
                    name="sellingPrice"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g., 3500.00"
                    className="block w-full rounded-md border-gray-300 pl-12 focus:border-[#635bff] focus:ring-[#635bff] sm:text-sm"
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                  Upload Photo (Optional)
                </label>
                <input
                  type="file"
                  id="photo"
                  name="photo"
                  onChange={handlePhotoChange}
                  accept="image/*"
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[#635bff] file:text-white
                    hover:file:bg-[#4f46e5]"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="e.g., Size: 10, Color: Maroon, Supplier: Gikomba, Special instructions: Dry clean only"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#635bff] focus:ring-[#635bff] sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#635bff] hover:bg-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635bff] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Stock...
                </>
              ) : (
                'Add Stock'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 
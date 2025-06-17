'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase, getCurrentUser } from '@/lib/supabase'

interface Product {
  id: string
  name: string
  type: string
  quantity: number
  purchasePrice: number
  sellingPrice: number
  supplier: string
}

interface EditModalProps {
  product: Product | null
  onClose: () => void
  onSave: (updated: Product) => void
}

function EditModal({ product, onClose, onSave }: EditModalProps) {
  const [form, setForm] = useState(product || {
    id: '', name: '', type: '', quantity: 0, purchasePrice: 0, sellingPrice: 0, supplier: ''
  })
  useEffect(() => { if (product) setForm(product) }, [product])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-lg font-bold mb-4">Edit Product</h2>
        <div className="space-y-3">
          <input className="w-full border rounded p-2" placeholder="Name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
          <input className="w-full border rounded p-2" placeholder="Type" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} />
          <input className="w-full border rounded p-2" placeholder="Supplier" value={form.supplier} onChange={e => setForm(f => ({...f, supplier: e.target.value}))} />
          <input className="w-full border rounded p-2" type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: Number(e.target.value)}))} />
          <input className="w-full border rounded p-2" type="number" placeholder="Purchase Price" value={form.purchasePrice} onChange={e => setForm(f => ({...f, purchasePrice: Number(e.target.value)}))} />
          <input className="w-full border rounded p-2" type="number" placeholder="Selling Price" value={form.sellingPrice} onChange={e => setForm(f => ({...f, sellingPrice: Number(e.target.value)}))} />
        </div>
        <div className="flex gap-2 mt-5">
          <button className="flex-1 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
          <button className="flex-1 py-2 rounded bg-[#635bff] text-white" onClick={() => onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 8
  const [totalCount, setTotalCount] = useState(0)

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
      // Get total count
      const { count: total, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id as string)
      if (countError) throw countError
      setTotalCount(total || 0)
      // Fetch paginated products
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id as string)
        .range(from, to)
      if (error) throw error
      setProducts(
        ((data || []) as Array<{ id: string; name: string; type: string; quantity: number; purchase_price: number; selling_price: number; supplier: string }> ).map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          quantity: p.quantity,
          purchasePrice: p.purchase_price,
          sellingPrice: p.selling_price,
          supplier: p.supplier,
        }))
      )
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to fetch products')
      }
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.supplier.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !selectedType || product.type === selectedType
    return matchesSearch && matchesType
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'quantity':
        return b.quantity - a.quantity
      case 'price':
        return b.sellingPrice - a.sellingPrice
      default:
        return 0
    }
  })

  // Delete handler
  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      setProducts(products => products.filter(p => p.id !== id))
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert('Failed to delete: ' + err.message)
      } else {
        alert('Failed to delete: Unknown error')
      }
    } finally {
      setDeletingId(null)
    }
  }

  // Edit handler
  const handleSaveEdit = async (updated: Product) => {
    try {
      const { error } = await supabase.from('products').update({
        name: updated.name,
        type: updated.type,
        supplier: updated.supplier,
        quantity: updated.quantity,
        purchase_price: updated.purchasePrice,
        selling_price: updated.sellingPrice,
      }).eq('id', updated.id)
      if (error) throw error
      setProducts(products => products.map(p => p.id === updated.id ? updated : p))
      setEditProduct(null)
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert('Failed to update: ' + err.message)
      } else {
        alert('Failed to update: Unknown error')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-lg text-gray-600">Loading inventory...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-lg text-red-600">{error}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-[#635bff] to-[#4f46e5] px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Inventory Management</h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100">View and manage your stock items</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 py-4 sm:px-4 sm:py-8">
        {/* Action Bar */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-[#635bff] focus:ring-1 focus:ring-[#635bff] text-sm sm:text-base bg-white shadow-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-4">
            <select
              value={selectedType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedType(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-[#635bff] focus:ring-1 focus:ring-[#635bff] text-sm bg-white shadow-sm"
            >
              <option value="">All Types</option>
              <option value="Running Shoes">Running Shoes</option>
              <option value="Sports T-shirt">Sports T-shirt</option>
              <option value="Training Shorts">Training Shorts</option>
            </select>
            <select
              value={sortBy}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-[#635bff] focus:ring-1 focus:ring-[#635bff] text-sm bg-white shadow-sm"
            >
              <option value="name">Sort by Name</option>
              <option value="quantity">Sort by Quantity</option>
              <option value="price">Sort by Price</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          {sortedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 p-4 flex flex-col justify-between min-h-[210px] border border-gray-100"
            >
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 capitalize leading-tight">{product.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 mb-1">{product.type}</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
                    {product.quantity}
                  </span>
                </div>
                <div className="mt-1 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Supplier</span>
                    <span className="text-gray-900 font-medium">{product.supplier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Purchase Price</span>
                    <span className="text-gray-900 font-medium">KES {product.purchasePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Selling Price</span>
                    <span className="text-gray-900 font-medium">KES {product.sellingPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  className="flex-1 px-4 py-2 text-xs sm:text-sm font-semibold text-[#635bff] bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none transition"
                  onClick={() => setEditProduct(product)}
                >
                  Edit
                </button>
                <button
                  className="flex-1 px-4 py-2 text-xs sm:text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none transition"
                  onClick={() => handleDelete(product.id)}
                  disabled={deletingId === product.id}
                >
                  {deletingId === product.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-gray-700 font-medium">
            Page {page} of {Math.max(1, Math.ceil(totalCount / pageSize))}
          </span>
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold disabled:opacity-50"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(totalCount / pageSize)}
          >
            Next
          </button>
        </div>

        {/* Empty State */}
        {sortedProducts.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding some products to your inventory.</p>
            <div className="mt-6">
              <Link
                href="/dashboard/add-stock"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#635bff] hover:bg-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635bff]"
              >
                Add Stock
              </Link>
            </div>
          </div>
        )}

        {/* Add Stock Button */}
        {sortedProducts.length > 0 && (
          <div className="fixed bottom-5 right-5 z-50">
            <Link
              href="/dashboard/add-stock"
              className="flex items-center justify-center w-14 h-14 rounded-full bg-[#635bff] text-white shadow-lg hover:bg-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635bff]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </Link>
          </div>
        )}
      </div>
      {editProduct && (
        <EditModal
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  )
} 
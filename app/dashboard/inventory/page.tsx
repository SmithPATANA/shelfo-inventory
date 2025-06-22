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

type RawProduct = {
  id: string
  name: string
  type: string
  quantity: number
  purchase_price: number
  selling_price: number
  supplier: string
  [key: string]: any;
};

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
          <input className="w-full border rounded p-2 text-gray-900" placeholder="Name" value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({...f, name: e.target.value}))} />
          <input className="w-full border rounded p-2 text-gray-900" placeholder="Type" value={form.type} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({...f, type: e.target.value}))} />
          <input className="w-full border rounded p-2 text-gray-900" placeholder="Supplier" value={form.supplier} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({...f, supplier: e.target.value}))} />
          <input className="w-full border rounded p-2 text-gray-900" type="number" placeholder="Quantity" value={form.quantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({...f, quantity: Number(e.target.value)}))} />
          <input className="w-full border rounded p-2 text-gray-900" type="number" placeholder="Purchase Price" value={form.purchasePrice} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({...f, purchasePrice: Number(e.target.value)}))} />
          <input className="w-full border rounded p-2 text-gray-900" type="number" placeholder="Selling Price" value={form.sellingPrice} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({...f, sellingPrice: Number(e.target.value)}))} />
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
  const [sortBy, setSortBy] = useState('newest')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 8
  const [totalCount, setTotalCount] = useState(0)
  const [activeSearch, setActiveSearch] = useState('')

  const fetchProducts = useCallback(async () => {
    setSearchLoading(true)
    setError(null)

    try {
      const user = await getCurrentUser()
      if (!user) {
        setError('User not authenticated')
        return
      }

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id as string)
        .gt('quantity', 0)

      if (activeSearch.trim()) {
        const searchLower = activeSearch.toLowerCase().trim()
        query = query.or(
          `name.ilike.%${searchLower}%,type.ilike.%${searchLower}%,supplier.ilike.%${searchLower}%`
        )
      }

      if (selectedType.trim()) {
        query = query.eq('type', selectedType)
      }

      const { count: total, error: countError } = await query
      if (countError) throw countError
      setTotalCount(total || 0)

      switch (sortBy) {
        case 'name':
          query = query.order('name', { ascending: true })
          break
        case 'quantity':
          query = query.order('quantity', { ascending: false })
          break
        case 'price':
          query = query.order('selling_price', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const { data, error } = await query.range(from, to)

      if (error) throw error

      setProducts(
        (data || []).map((p: RawProduct) => ({
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
        setError(err.message || 'Failed to fetch products.')
      } else {
        setError('An unknown error occurred.')
      }
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }, [activeSearch, selectedType, sortBy, page, pageSize])

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = () => {
    setPage(1)
    setActiveSearch(searchQuery)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setActiveSearch('')
    setPage(1)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      fetchProducts()
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
      fetchProducts()
      setEditProduct(null)
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert('Failed to update: ' + err.message)
      } else {
        alert('Failed to update: Unknown error')
      }
    }
  }

  if (loading && page === 1 && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-lg text-gray-600">Loading inventory...</span>
      </div>
    );
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
        <div className="mb-4 flex flex-col gap-3">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative flex">
                <input
                  type="text"
                  placeholder="Search products by name, type, or supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 rounded-l-lg border border-gray-300 pl-4 pr-4 py-3 sm:py-2 focus:border-[#635bff] focus:ring-1 focus:ring-[#635bff] text-sm sm:text-base bg-white shadow-sm text-gray-900"
                />
                <button
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="px-4 py-3 sm:py-2 bg-[#635bff] text-white rounded-r-lg hover:bg-[#4f46e5] focus:outline-none focus:ring-1 focus:ring-[#635bff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {searchLoading && !loading ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>
                {activeSearch && (
                  <button
                    onClick={handleClearSearch}
                    className="ml-2 px-3 py-3 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors"
                    title="Clear search"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <select
              value={selectedType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedType(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-gray-300 px-3 py-3 sm:py-2 focus:border-[#635bff] focus:ring-1 focus:ring-[#635bff] text-sm bg-white shadow-sm"
            >
              <option value="">All Types</option>
              <option value="Running Shoes">Running Shoes</option>
              <option value="Sports T-shirt">Sports T-shirt</option>
              <option value="Training Shorts">Training Shorts</option>
            </select>
            <select
              value={sortBy}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-gray-300 px-3 py-3 sm:py-2 focus:border-[#635bff] focus:ring-1 focus:ring-[#635bff] text-sm bg-white shadow-sm"
            >
              <option value="newest">Newest First</option>
              <option value="name">Sort by Name</option>
              <option value="quantity">Sort by Quantity</option>
              <option value="price">Sort by Price</option>
            </select>
          </div>
        </div>

        {/* Search Results Info */}
        {(activeSearch || selectedType) && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              Showing {totalCount} result{totalCount !== 1 ? 's' : ''}
              {activeSearch && ` for "${activeSearch}"`}
              {selectedType && ` in ${selectedType}`}
            </p>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 p-4 sm:p-4 flex flex-col justify-between min-h-[200px] sm:min-h-[210px] border border-gray-100"
            >
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 capitalize leading-tight truncate">{product.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 mb-1">{product.type}</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 whitespace-nowrap ml-2">
                    {product.quantity}
                  </span>
                </div>
                <div className="mt-1 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Supplier</span>
                    <span className="text-gray-900 font-medium truncate ml-2">{product.supplier}</span>
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
                  className="flex-1 px-4 py-3 sm:py-2 text-xs sm:text-sm font-semibold text-[#635bff] bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none transition active:bg-blue-200"
                  onClick={() => setEditProduct(product)}
                >
                  Edit
                </button>
                <button
                  className="flex-1 px-4 py-3 sm:py-2 text-xs sm:text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none transition active:bg-red-200"
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
        {totalCount > pageSize && (
          <div className="mt-8">
            {/* Desktop Pagination */}
            <div className="hidden md:flex justify-center items-center gap-2">
              {/* Previous Button */}
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>

              {/* Page Numbers */}
              {(() => {
                const totalPages = Math.ceil(totalCount / pageSize)
                const maxVisiblePages = 7
                const pages: (number | string)[] = []

                if (totalPages <= maxVisiblePages) {
                  // Show all pages if total is small
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i)
                  }
                } else {
                  // Show smart pagination with ellipsis
                  if (page <= 4) {
                    // Near the beginning
                    for (let i = 1; i <= 5; i++) {
                      pages.push(i)
                    }
                    pages.push('...')
                    pages.push(totalPages)
                  } else if (page >= totalPages - 3) {
                    // Near the end
                    pages.push(1)
                    pages.push('...')
                    for (let i = totalPages - 4; i <= totalPages; i++) {
                      pages.push(i)
                    }
                  } else {
                    // In the middle
                    pages.push(1)
                    pages.push('...')
                    for (let i = page - 1; i <= page + 1; i++) {
                      pages.push(i)
                    }
                    pages.push('...')
                    pages.push(totalPages)
                  }
                }

                return pages.map((pageNum, index) => (
                  <div key={index}>
                    {pageNum === '...' ? (
                      <span className="px-3 py-2 text-gray-500">...</span>
                    ) : (
                      <button
                        className={`px-3 py-2 rounded-lg font-semibold transition-colors ${
                          page === pageNum
                            ? 'bg-[#635bff] text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        onClick={() => setPage(pageNum as number)}
                      >
                        {pageNum}
                      </button>
                    )}
                  </div>
                ))
              })()}

              {/* Next Button */}
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(totalCount / pageSize)}
              >
                Next
              </button>
            </div>

            {/* Mobile Pagination */}
            <div className="md:hidden">
              {/* Mobile Previous/Next */}
              <div className="flex justify-between items-center mb-4">
                <button
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span className="text-gray-700 font-medium">
                  Page {page} of {Math.ceil(totalCount / pageSize)}
                </span>
                <button
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(totalCount / pageSize)}
                >
                  Next
                </button>
              </div>

              {/* Mobile Page Numbers - Compact */}
              {(() => {
                const totalPages = Math.ceil(totalCount / pageSize)
                const pages: (number | string)[] = []

                if (totalPages <= 5) {
                  // Show all pages if total is small
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i)
                  }
                } else {
                  // Show compact pagination for mobile
                  if (page <= 3) {
                    // Near the beginning
                    for (let i = 1; i <= 3; i++) {
                      pages.push(i)
                    }
                    pages.push('...')
                    pages.push(totalPages)
                  } else if (page >= totalPages - 2) {
                    // Near the end
                    pages.push(1)
                    pages.push('...')
                    for (let i = totalPages - 2; i <= totalPages; i++) {
                      pages.push(i)
                    }
                  } else {
                    // In the middle
                    pages.push(1)
                    pages.push('...')
                    pages.push(page)
                    pages.push('...')
                    pages.push(totalPages)
                  }
                }

                return (
                  <div className="flex justify-center items-center gap-1">
                    {pages.map((pageNum, index) => (
                      <div key={index}>
                        {pageNum === '...' ? (
                          <span className="px-2 py-1 text-gray-500 text-sm">...</span>
                        ) : (
                          <button
                            className={`px-3 py-1 rounded font-semibold text-sm transition-colors ${
                              page === pageNum
                                ? 'bg-[#635bff] text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            onClick={() => setPage(pageNum as number)}
                          >
                            {pageNum}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* Page Info */}
        {totalCount > pageSize && (
          <div className="text-center mt-4 text-sm text-gray-600">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} products
          </div>
        )}

        {/* Empty State */}
        {products.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {activeSearch || selectedType ? 'No products found' : 'No products yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeSearch || selectedType
                ? 'Try adjusting your search criteria or filters.'
                : 'Get started by adding some products to your inventory.'}
            </p>
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
        {products.length > 0 && !loading && (
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
  );
} 
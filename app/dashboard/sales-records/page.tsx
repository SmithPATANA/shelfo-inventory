'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, getCurrentUser } from '@/lib/supabase'
import Link from 'next/link'

interface SaleRecord {
  id: string
  created_at: string
  quantity: number
  total_amount: number
  notes: string | null
  discount: number
  product: {
    id: string
    name: string
    type: string
    selling_price: number
    supplier: string
  }
}

type RawSaleRecord = {
  id?: unknown;
  created_at?: unknown;
  quantity?: unknown;
  total_amount?: unknown;
  notes?: unknown;
  discount?: unknown;
  product?: unknown;
  [key: string]: unknown;
};

export default function SalesRecordsPage() {
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'today' | 'week' | 'month'>('all')

  const fetchSalesRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const user = await getCurrentUser()
      if (!user) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      let query = supabase
        .from('sales')
        .select(`
          id,
          created_at,
          quantity,
          total_amount,
          notes,
          discount,
          product:products(
            id,
            name,
            type,
            selling_price,
            supplier
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Apply date filters
      if (filterType !== 'all') {
        const now = new Date()
        let startDate: Date

        switch (filterType) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          default:
            startDate = new Date(0)
        }

        query = query.gte('created_at', startDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      setSalesRecords(
        (data || []).map((record: RawSaleRecord) => ({
          ...record,
          product: Array.isArray(record.product) ? record.product[0] : record.product
        })) as SaleRecord[]
      )
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to fetch sales records')
      } else {
        setError('Failed to fetch sales records')
      }
    } finally {
      setLoading(false)
    }
  }, [filterType])

  useEffect(() => {
    fetchSalesRecords()
  }, [fetchSalesRecords])

  const filteredRecords = salesRecords.filter(record =>
    record.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.product.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.product.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const getTotalRevenue = () => {
    return filteredRecords.reduce((sum, record) => sum + record.total_amount, 0)
  }

  const getTotalItemsSold = () => {
    return filteredRecords.reduce((sum, record) => sum + record.quantity, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading sales records...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-4">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={fetchSalesRecords}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales Records</h1>
              <p className="mt-1 text-sm text-gray-500">View and manage all your sales history.</p>
            </div>
            <Link
                href="/dashboard/sales"
                className="inline-flex items-center justify-center w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Record New Sale
              </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by product, type, supplier, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'today' | 'week' | 'month')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Transactions" value={filteredRecords.length.toString()} icon="document" />
          <StatCard title="Total Revenue" value={`KES ${getTotalRevenue().toLocaleString()}`} icon="currency" />
          <StatCard title="Items Sold" value={getTotalItemsSold().toString()} icon="inventory" />
        </div>

        {/* Sales History */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Sales History</h2>
          </div>
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-2">No sales records found for the selected period.</p>
              <p className="text-sm">Try adjusting your filters or record a new sale.</p>
            </div>
          ) : (
            <div>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => {
                      const { date, time } = formatDate(record.created_at)
                      return (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{date}</div>
                            <div className="text-sm text-gray-500">{time}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{record.product.name}</div>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {record.product.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-blue-600 font-medium">{record.product.supplier}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-800">{record.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">- KES {record.discount.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">KES {record.total_amount.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={record.notes ?? ''}>{record.notes}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden">
                <ul className="divide-y divide-gray-200">
                  {filteredRecords.map((record) => {
                    const { date, time } = formatDate(record.created_at)
                    return (
                      <li key={record.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">{record.product.name}</p>
                            <span className="inline-flex mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {record.product.type}
                            </span>
                            <p className="text-xs text-blue-600 font-medium mt-1">Supplier: {record.product.supplier}</p>
                          </div>
                          <p className="text-sm font-bold text-green-600">KES {record.total_amount.toLocaleString()}</p>
                        </div>
                        <div className="mt-3 text-sm text-gray-600 flex justify-between">
                          <span>Qty: <span className="font-medium">{record.quantity}</span></span>
                          <span className="text-right">
                            <p>{date}</p>
                            <p>{time}</p>
                          </span>
                        </div>
                        {record.notes && (
                           <p className="mt-2 text-sm text-gray-500 italic bg-gray-50 p-2 rounded">Note: {record.notes}</p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: 'document' | 'currency' | 'inventory' }) {
  const icons = {
    document: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    currency: (
       <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    inventory: (
       <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    )
  }
  
  const bgColors = {
      document: 'bg-blue-50',
      currency: 'bg-green-50',
      inventory: 'bg-purple-50'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${bgColors[icon]}`}>
          {icons[icon]}
        </div>
      </div>
    </div>
  )
} 
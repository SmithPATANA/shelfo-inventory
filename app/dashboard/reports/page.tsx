'use client'

import { useState, useEffect } from 'react'
import { supabase, getCurrentUser } from '@/lib/supabase'

interface SalesData {
  date: string
  revenue: number
  orders: number
}

interface TopProduct {
  name: string
  sales: number
  revenue: number
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('month')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [salesData, setSalesData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [averageOrderValue, setAverageOrderValue] = useState(0)

  const dateRanges = [
    { value: 'week', label: 'Last 7 Days', days: 7 },
    { value: 'month', label: 'Last 30 Days', days: 30 },
    { value: 'quarter', label: 'Last 90 Days', days: 90 },
    { value: 'year', label: 'Last 365 Days', days: 365 }
  ]

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      setError(null)
      try {
        const user = await getCurrentUser()
        if (!user) throw new Error('User not authenticated')
        // Date filtering
        const now = new Date()
        const range = dateRanges.find(r => r.value === dateRange) || dateRanges[1]
        const fromDate = new Date(now)
        fromDate.setDate(now.getDate() - (range.days - 1))
        fromDate.setHours(0, 0, 0, 0)
        // Fetch sales
        const { data, error } = await supabase
          .from('sales')
          .select('id, created_at, product_id, quantity, total_amount')
          .eq('user_id', user.id as any)
        if (error) throw error
        // Filter by date
        const filtered = (data || []).filter((sale: any) => {
          const saleDate = new Date(sale.created_at)
          return saleDate >= fromDate && saleDate <= now
        })
        setSalesData(filtered)
        // Metrics
        const revenue = filtered.reduce((sum: number, sale: any) => sum + Number(sale.total_amount), 0)
        setTotalRevenue(revenue)
        setTotalOrders(filtered.length)
        setAverageOrderValue(filtered.length > 0 ? revenue / filtered.length : 0)
        // Top products
        const productMap: Record<string, { name: string; sales: number; revenue: number }> = {}
        for (const sale of filtered) {
          if (!productMap[sale.product_id]) {
            productMap[sale.product_id] = { name: sale.product_id, sales: 0, revenue: 0 }
          }
          productMap[sale.product_id].sales += sale.quantity
          productMap[sale.product_id].revenue += Number(sale.total_amount)
        }
        // Fetch product names
        const productIds = Object.keys(productMap)
        if (productIds.length > 0) {
          const { data: productsData } = await supabase
            .from('products')
            .select('id, name')
            .in('id', productIds as any)
          for (const prod of productsData || []) {
            if (productMap[prod.id]) productMap[prod.id].name = prod.name
          }
        }
        setTopProducts(
          Object.values(productMap)
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5)
        )
      } catch (err: any) {
        setError(err.message || 'Failed to fetch reports')
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
    // eslint-disable-next-line
  }, [dateRange])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-lg text-gray-600">Loading reports...</span>
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
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="mt-1 sm:mt-2 text-sm text-gray-600">Track your business performance</p>
      </div>

      {/* Mobile Filter */}
      <div className="sm:hidden mb-4">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-between bg-white"
        >
          <span className="text-sm font-medium text-gray-700">
            {dateRanges.find(range => range.value === dateRange)?.label}
          </span>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isFilterOpen && (
          <div className="mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="space-y-2">
              {dateRanges.map(range => (
                <button
                  key={range.value}
                  onClick={() => {
                    setDateRange(range.value)
                    setIsFilterOpen(false)
                  }}
                  className={`w-full px-4 py-2 text-left rounded-lg text-sm ${
                    dateRange === range.value
                      ? 'bg-[#635bff] text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Filter */}
      <div className="hidden sm:flex mb-6 justify-end">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#635bff] focus:border-transparent"
        >
          {dateRanges.map(range => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">KES {totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Order Value</p>
              <p className="text-2xl font-bold text-gray-900">KES {averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h2>
        <div className="h-64 sm:h-80">
          {/* Replace with actual chart component */}
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            Chart visualization will be implemented here
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Units Sold
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topProducts.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.sales}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">KES {product.revenue.toLocaleString()}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-end">
        <button className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export as PDF
        </button>
        <button className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export as CSV
        </button>
      </div>
    </div>
  )
} 
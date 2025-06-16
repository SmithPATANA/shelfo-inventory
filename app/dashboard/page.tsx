'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase, getCurrentUser } from '@/lib/supabase'

export default function DashboardPage() {
  const [totalProducts, setTotalProducts] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalSales, setTotalSales] = useState<number | null>(null)

  const features = [
    {
      title: 'Add Stock',
      description: 'Add new products to your inventory',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      href: '/dashboard/add-stock',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'View Stock',
      description: 'View and manage your inventory',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
      href: '/dashboard/inventory',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Sales',
      description: 'Track your sales and transactions',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: '/dashboard/sales',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Reports',
      description: 'View business analytics and reports',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/dashboard/reports',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  useEffect(() => {
    const fetchTotalProducts = async () => {
      setLoading(true)
      setError(null)
      try {
        const user = await getCurrentUser()
        if (!user) {
          setError('User not authenticated')
          setLoading(false)
          return
        }
        const { count, error } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id as any)
        if (error) throw error
        setTotalProducts(count || 0)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch total products')
      } finally {
        setLoading(false)
      }
    }
    fetchTotalProducts()
  }, [])

  useEffect(() => {
    const fetchTotalSales = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) return
        // Get first and last day of current month
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        const { data, error } = await supabase
          .from('sales')
          .select('total_amount, created_at')
          .eq('user_id', user.id as any)
        if (error) throw error
        // Filter for current month and sum
        const total = (data || [])
          .filter((sale: any) => {
            const saleDate = new Date(sale.created_at)
            return saleDate >= firstDay && saleDate <= lastDay
          })
          .reduce((sum: number, sale: any) => sum + Number(sale.total_amount), 0)
        setTotalSales(total)
      } catch (err: any) {
        setTotalSales(0)
      }
    }
    fetchTotalSales()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-[#635bff] to-[#4f46e5] px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Welcome to ShelfO</h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100">Your inventory management system</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 py-4 sm:px-4 sm:py-8">
        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {features.map((feature, index) => (
            <Link
              key={index}
              href={feature.href}
              className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color} text-white transform group-hover:scale-110 transition-transform duration-200`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[#635bff] transition-colors duration-200">
                      {feature.title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">{feature.description}</p>
                  </div>
                  <div className="text-gray-400 group-hover:text-[#635bff] transition-colors duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {loading ? '...' : error ? '!' : totalProducts}
                </p>
                <p className="mt-1 text-sm text-gray-500">in your inventory</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {totalSales === null ? '...' : `KES ${totalSales.toLocaleString()}`}
                </p>
                <p className="mt-1 text-sm text-gray-500">this month</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-4">
            <Link
              href="/dashboard/add-stock"
              className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-[#635bff] to-[#4f46e5] text-white rounded-lg hover:opacity-90 transition-opacity duration-200 text-base"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Stock
            </Link>
            <Link
              href="/dashboard/sales"
              className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-90 transition-opacity duration-200 text-base"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Record Sale
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 
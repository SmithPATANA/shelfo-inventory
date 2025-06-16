'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [showMobileNav, setShowMobileNav] = useState(false)

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

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-[#f5f7fa] to-[#e9ecf3] shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-2xl font-extrabold text-[#635bff] tracking-tight flex items-center">
                <span className="mr-2">Shelfo</span>
                <span className="hidden sm:inline text-xs font-semibold text-[#4f46e5]">Inventory</span>
              </Link>
              {/* Hamburger for mobile */}
              <div className="sm:hidden flex items-center">
                <button
                  onClick={() => setShowMobileNav((v) => !v)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-[#635bff] hover:bg-gray-100 focus:outline-none"
                  aria-label="Open main menu"
                >
                  <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              {/* Desktop nav */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className={`inline-flex items-center px-2 pt-1 border-b-2 text-base font-medium transition-colors duration-150 ${
                    pathname === '/dashboard'
                      ? 'border-[#635bff] text-[#635bff] bg-[#f5f7fa]'
                      : 'border-transparent text-gray-500 hover:border-[#635bff] hover:text-[#635bff]'
                  }`}
                >
                  Overview
                </Link>
                <Link
                  href="/dashboard/inventory"
                  className={`inline-flex items-center px-2 pt-1 border-b-2 text-base font-medium transition-colors duration-150 ${
                    pathname === '/dashboard/inventory'
                      ? 'border-[#635bff] text-[#635bff] bg-[#f5f7fa]'
                      : 'border-transparent text-gray-500 hover:border-[#635bff] hover:text-[#635bff]'
                  }`}
                >
                  Inventory
                </Link>
                <Link
                  href="/dashboard/add-stock"
                  className={`inline-flex items-center px-2 pt-1 border-b-2 text-base font-medium transition-colors duration-150 ${
                    pathname === '/dashboard/add-stock'
                      ? 'border-[#635bff] text-[#635bff] bg-[#f5f7fa]'
                      : 'border-transparent text-gray-500 hover:border-[#635bff] hover:text-[#635bff]'
                  }`}
                >
                  Add Stock
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-5 py-2 border border-[#635bff] text-base font-semibold rounded-lg text-white bg-[#635bff] hover:bg-[#4f46e5] shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635bff] transition-all duration-150"
              >
                Logout
              </button>
            </div>
          </div>
          {/* Mobile nav links */}
          {showMobileNav && (
            <div className="sm:hidden mt-2 pb-2 flex flex-col gap-2 bg-white rounded-lg shadow border border-gray-100">
              <Link
                href="/dashboard"
                className={`block px-4 py-2 rounded text-base font-medium ${
                  pathname === '/dashboard'
                    ? 'bg-[#635bff] text-white'
                    : 'text-gray-700 hover:bg-[#f5f7fa] hover:text-[#635bff]'
                }`}
                onClick={() => setShowMobileNav(false)}
              >
                Overview
              </Link>
              <Link
                href="/dashboard/inventory"
                className={`block px-4 py-2 rounded text-base font-medium ${
                  pathname === '/dashboard/inventory'
                    ? 'bg-[#635bff] text-white'
                    : 'text-gray-700 hover:bg-[#f5f7fa] hover:text-[#635bff]'
                }`}
                onClick={() => setShowMobileNav(false)}
              >
                Inventory
              </Link>
              <Link
                href="/dashboard/add-stock"
                className={`block px-4 py-2 rounded text-base font-medium ${
                  pathname === '/dashboard/add-stock'
                    ? 'bg-[#635bff] text-white'
                    : 'text-gray-700 hover:bg-[#f5f7fa] hover:text-[#635bff]'
                }`}
                onClick={() => setShowMobileNav(false)}
              >
                Add Stock
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-6 sm:py-8">
        {children}
      </main>
    </div>
  )
} 
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
      <nav className="backdrop-blur-md bg-white/70 shadow-lg border-b border-gray-200 rounded-b-2xl mx-1 sm:mx-2 mt-2 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4 sm:gap-6 w-full">
              <Link href="/dashboard" className="text-2xl font-extrabold text-[#635bff] tracking-tight flex items-center whitespace-nowrap">
                <span className="mr-2">Shelfo</span>
                <span className="hidden sm:inline text-xs font-semibold text-[#4f46e5]">Inventory</span>
              </Link>
              {/* Hamburger for mobile */}
              <div className="sm:hidden flex items-center ml-auto">
                <button
                  onClick={() => setShowMobileNav((v) => !v)}
                  className="inline-flex items-center justify-center p-3 rounded-md text-gray-500 hover:text-[#635bff] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#635bff]"
                  aria-label="Open main menu"
                >
                  <svg className="h-7 w-7" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              {/* Desktop nav */}
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4 bg-white/60 rounded-full px-2 py-1 shadow-inner border border-gray-100">
                <Link
                  href="/dashboard"
                  className={`inline-flex items-center px-5 py-2 rounded-full text-base font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#635bff] focus:ring-offset-2 ${
                    pathname === '/dashboard'
                      ? 'bg-[#635bff]/90 text-white shadow-md'
                      : 'text-gray-600 hover:bg-[#635bff]/10 hover:text-[#635bff]'
                  }`}
                >
                  Overview
                </Link>
                <Link
                  href="/dashboard/inventory"
                  className={`inline-flex items-center px-5 py-2 rounded-full text-base font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#635bff] focus:ring-offset-2 ${
                    pathname === '/dashboard/inventory'
                      ? 'bg-[#635bff]/90 text-white shadow-md'
                      : 'text-gray-600 hover:bg-[#635bff]/10 hover:text-[#635bff]'
                  }`}
                >
                  Inventory
                </Link>
                <Link
                  href="/dashboard/add-stock"
                  className={`inline-flex items-center px-5 py-2 rounded-full text-base font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#635bff] focus:ring-offset-2 ${
                    pathname === '/dashboard/add-stock'
                      ? 'bg-[#635bff]/90 text-white shadow-md'
                      : 'text-gray-600 hover:bg-[#635bff]/10 hover:text-[#635bff]'
                  }`}
                >
                  Add Stock
                </Link>
              </div>
            </div>
            <div className="hidden sm:flex items-center">
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
            <div className="sm:hidden mt-2 pb-2 flex flex-col gap-2 bg-white/90 rounded-xl shadow border border-gray-100">
              <Link
                href="/dashboard"
                className={`block px-6 py-4 rounded-full text-lg font-semibold ${
                  pathname === '/dashboard'
                    ? 'bg-[#635bff]/90 text-white shadow'
                    : 'text-gray-700 hover:bg-[#635bff]/10 hover:text-[#635bff]'
                }`}
                onClick={() => setShowMobileNav(false)}
              >
                Overview
              </Link>
              <Link
                href="/dashboard/inventory"
                className={`block px-6 py-4 rounded-full text-lg font-semibold ${
                  pathname === '/dashboard/inventory'
                    ? 'bg-[#635bff]/90 text-white shadow'
                    : 'text-gray-700 hover:bg-[#635bff]/10 hover:text-[#635bff]'
                }`}
                onClick={() => setShowMobileNav(false)}
              >
                Inventory
              </Link>
              <Link
                href="/dashboard/add-stock"
                className={`block px-6 py-4 rounded-full text-lg font-semibold ${
                  pathname === '/dashboard/add-stock'
                    ? 'bg-[#635bff]/90 text-white shadow'
                    : 'text-gray-700 hover:bg-[#635bff]/10 hover:text-[#635bff]'
                }`}
                onClick={() => setShowMobileNav(false)}
              >
                Add Stock
              </Link>
              <button
                onClick={handleLogout}
                className="mt-2 w-full px-6 py-4 rounded-full text-lg font-semibold border border-[#635bff] text-white bg-[#635bff] hover:bg-[#4f46e5] shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635bff] transition-all duration-150"
              >
                Logout
              </button>
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
'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log('AuthProvider: Initializing with pathname:', pathname)

    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Checking session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('AuthProvider: Session error:', error)
          throw error
        }

        console.log('AuthProvider: Session status:', !!session)

        // If user is not logged in and trying to access dashboard routes
        if (!session && pathname.startsWith('/dashboard')) {
          console.log('AuthProvider: No session, redirecting to login')
          router.push('/login')
          return
        }

        // If user is logged in and trying to access auth routes
        if (session && (pathname === '/login' || pathname === '/signup')) {
          console.log('AuthProvider: Has session, redirecting to dashboard')
          router.push('/dashboard')
          return
        }

        console.log('AuthProvider: Auth check complete')
        setIsLoading(false)
      } catch (error) {
        console.error('AuthProvider: Auth initialization error:', error)
        if (pathname.startsWith('/dashboard')) {
          router.push('/login')
        }
        setIsLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: Auth state changed:', event, !!session)
      
      if (event === 'SIGNED_OUT') {
        router.push('/')
      } else if (event === 'SIGNED_IN' && pathname === '/') {
        router.push('/dashboard')
      }
    })

    return () => {
      console.log('AuthProvider: Cleaning up subscription')
      subscription.unsubscribe()
    }
  }, [pathname, router])

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

  return <>{children}</>
} 
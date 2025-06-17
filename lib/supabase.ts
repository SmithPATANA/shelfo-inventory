import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'shelfo-auth-token',
      debug: process.env.NODE_ENV === 'development',
    },
    global: {
      headers: {
        'x-application-name': 'shelfo',
      },
    },
  }
)

// Initialize the session
export const initializeSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Session initialization error:', error)
    return null
  }
}

// Type for the response from Supabase
export type SupabaseResponse<T> = {
  data: T | null
  error: Error | null
}

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return !!session
  } catch (error) {
    console.error('Auth check error:', error)
    return false
  }
}

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}

// Debug function to check session status
export const debugSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    console.log('Current session:', session)
    console.log('Session error:', error)
    return session
  } catch (error) {
    console.error('Debug session error:', error)
    return null
  }
} 
import { createServerSupabaseClient } from './supabase-server'
import { redirect } from 'next/navigation'

export async function getSession() {
  const supabase = await createServerSupabaseClient()
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('getSession error:', error)
      return null
    }
    return session
  } catch (error) {
    console.error('getSession error:', error)
    return null
  }
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }
  return session
}

export async function getUser() {
  const supabase = await createServerSupabaseClient()
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('getUser error:', error)
      return null
    }
    return user
  } catch (error) {
    console.error('getUser error:', error)
    return null
  }
}

export async function getUserProfile() {
  const supabase = await createServerSupabaseClient()
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('getUserProfile user error:', userError)
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('getUserProfile profile error:', profileError)
      return null
    }

    return profile
  } catch (error) {
    console.error('getUserProfile error:', error)
    return null
  }
} 
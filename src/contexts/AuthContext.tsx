import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase, User, CreditTransaction } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  addCredits: (amount: number, type: 'purchased' | 'bonus', description: string) => Promise<void>
  deductCredits: (amount: number, description: string, module?: string) => Promise<boolean>
  getCreditHistory: () => Promise<CreditTransaction[]>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Initialize user data from Supabase
  const initializeUser = async (supabaseUser: SupabaseUser) => {
    try {
      // Check if user exists in our users table
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      if (fetchError && fetchError.code === 'PGRST116') {
        // User doesn't exist, create new user with 5 free credits
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: supabaseUser.id,
              email: supabaseUser.email!,
              full_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
              avatar_url: supabaseUser.user_metadata?.avatar_url,
              credits: 5, // Free credits for new users
            }
          ])
          .select()
          .single()

        if (insertError) {
          console.error('Error creating user:', insertError)
          return
        }

        // Add welcome bonus transaction
        await supabase
          .from('credit_transactions')
          .insert([
            {
              user_id: supabaseUser.id,
              amount: 5,
              type: 'bonus',
              description: 'Welcome bonus - 5 free credits for new users',
            }
          ])

        setUser(newUser)
        toast({
          title: "Welcome to Productica!",
          description: "You've received 5 free credits to get started",
          duration: 5000,
        })
      } else if (existingUser) {
        setUser(existingUser)
      }
    } catch (error) {
      console.error('Error initializing user:', error)
    }
  }

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in:', error)
      toast({
        title: "Sign In Failed",
        description: "There was an error signing in with Google. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Refresh user data
  const refreshUser = async () => {
    if (session?.user) {
      await initializeUser(session.user)
    }
  }

  // Add credits
  const addCredits = async (amount: number, type: 'purchased' | 'bonus', description: string) => {
    if (!user) return

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ credits: user.credits + amount })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Add transaction record
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert([
          {
            user_id: user.id,
            amount,
            type,
            description,
          }
        ])

      if (transactionError) throw transactionError

      // Update local state
      setUser(prev => prev ? { ...prev, credits: prev.credits + amount } : null)

      toast({
        title: "Credits Added!",
        description: `${amount} credits added. Total: ${user.credits + amount}`,
        duration: 3000,
      })
    } catch (error) {
      console.error('Error adding credits:', error)
      toast({
        title: "Error",
        description: "Failed to add credits. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Deduct credits
  const deductCredits = async (amount: number, description: string, module?: string): Promise<boolean> => {
    if (!user || user.credits < amount) return false

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ credits: user.credits - amount })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Add transaction record
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert([
          {
            user_id: user.id,
            amount: -amount,
            type: 'spent',
            description,
            module,
          }
        ])

      if (transactionError) throw transactionError

      // Update local state
      setUser(prev => prev ? { ...prev, credits: prev.credits - amount } : null)

      toast({
        title: "Credit Used",
        description: `${user.credits - amount} credits remaining`,
        duration: 2000,
      })

      return true
    } catch (error) {
      console.error('Error deducting credits:', error)
      toast({
        title: "Error",
        description: "Failed to deduct credits. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  // Get credit history
  const getCreditHistory = async (): Promise<CreditTransaction[]> => {
    if (!user) return []

    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching credit history:', error)
      return []
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        initializeUser(session.user)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session?.user) {
        await initializeUser(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
    refreshUser,
    addCredits,
    deductCredits,
    getCreditHistory,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

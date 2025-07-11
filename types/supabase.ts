export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string | null
          shop_name: string | null
          email: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name: string
          shop_name: string
          email: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          shop_name?: string | null
          email?: string | null
        }
      }
      products: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          type: string
          quantity: number
          purchase_price: number
          selling_price: number
          supplier: string
          notes: string | null
          image_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          type: string
          quantity: number
          purchase_price: number
          selling_price: number
          supplier: string
          notes?: string | null
          image_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          type?: string
          quantity?: number
          purchase_price?: number
          selling_price?: number
          supplier?: string
          notes?: string | null
          image_url?: string | null
        }
      }
      sales: {
        Row: {
          id: string
          created_at: string
          user_id: string
          product_id: string
          quantity: number
          total_amount: number
          notes: string | null
          discount: number
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          product_id: string
          quantity: number
          total_amount: number
          notes?: string | null
          discount: number
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          product_id?: string
          quantity?: number
          total_amount?: number
          notes?: string | null
          discount?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 

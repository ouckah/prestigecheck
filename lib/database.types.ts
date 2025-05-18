export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: number
          name: string
          logo: string
          elo: number
          votes: number
          win_percentage: number
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          logo: string
          elo?: number
          votes?: number
          win_percentage?: number
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          logo?: string
          elo?: number
          votes?: number
          win_percentage?: number
          created_at?: string
        }
      }
      scheduled_comparisons: {
        Row: {
          id: number
          date: string
          theme: string
          created_at: string
        }
        Insert: {
          id?: number
          date: string
          theme: string
          created_at?: string
        }
        Update: {
          id?: number
          date?: string
          theme?: string
          created_at?: string
        }
      }
      comparison_companies: {
        Row: {
          comparison_id: number
          company_id: number
        }
        Insert: {
          comparison_id: number
          company_id: number
        }
        Update: {
          comparison_id?: number
          company_id?: number
        }
      }
      votes: {
        Row: {
          id: number
          company_id: number
          user_id: string | null
          anonymous_id: string | null
          comparison_date: string
          created_at: string
        }
        Insert: {
          id?: number
          company_id: number
          user_id?: string | null
          anonymous_id?: string | null
          comparison_date: string
          created_at?: string
        }
        Update: {
          id?: number
          company_id?: number
          user_id?: string | null
          anonymous_id?: string | null
          comparison_date?: string
          created_at?: string
        }
      }
      system_announcements: {
        Row: {
          id: number
          key: string
          title: string
          short_description: string
          full_description: string | null
          is_active: boolean
          bg_color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          key: string
          title: string
          short_description: string
          full_description?: string | null
          is_active?: boolean
          bg_color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          key?: string
          title?: string
          short_description?: string
          full_description?: string | null
          is_active?: boolean
          bg_color?: string
          created_at?: string
          updated_at?: string
        }
      }
      elo_history: {
        Row: {
          id: number
          company_id: number
          date: string
          elo: number
          votes: number
          win_percentage: number
          daily_change: number
          created_at: string
        }
        Insert: {
          id?: number
          company_id: number
          date: string
          elo: number
          votes: number
          win_percentage: number
          daily_change: number
          created_at?: string
        }
        Update: {
          id?: number
          company_id?: number
          date?: string
          elo?: number
          votes?: number
          win_percentage?: number
          daily_change?: number
          created_at?: string
        }
      }
    }
  }
}

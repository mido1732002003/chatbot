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
          username: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          member_one: string
          member_two: string
          pair_key: string
          created_at: string
        }
        Insert: {
          id?: string
          member_one: string
          member_two: string
          created_at?: string
        }
        Update: {
          id?: string
          member_one?: string
          member_two?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: number
          conversation_id: string
          sender_id: string
          body: string
          created_at: string
        }
        Insert: {
          conversation_id: string
          sender_id: string
          body: string
          created_at?: string
        }
        Update: {
          conversation_id?: string
          sender_id?: string
          body?: string
          created_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier access
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
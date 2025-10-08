/**
 * Database Type Definitions for EquimApp
 * Auto-generated from Supabase schema
 *
 * Based on:
 * - /supabase/schema.sql
 * - /supabase/migrations/*.sql
 * - /supabase/rpc/*.sql
 */

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
          pseudo: string | null
          income_or_weight: number | null
          weight_override: number | null
          currency_code: string
          share_revenue: boolean
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          pseudo?: string | null
          income_or_weight?: number | null
          weight_override?: number | null
          currency_code?: string
          share_revenue?: boolean
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pseudo?: string | null
          income_or_weight?: number | null
          weight_override?: number | null
          currency_code?: string
          share_revenue?: boolean
          deleted_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      groups: {
        Row: {
          id: string
          name: string
          creator_id: string
          currency_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          creator_id: string
          currency_code?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          creator_id?: string
          currency_code?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_creator_id_fkey"
            columns: ["creator_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string | null
          phantom_pseudo: string | null
          phantom_income: number | null
          is_phantom: boolean
          claimed_at: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id?: string | null
          phantom_pseudo?: string | null
          phantom_income?: number | null
          is_phantom?: boolean
          claimed_at?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string | null
          phantom_pseudo?: string | null
          phantom_income?: number | null
          is_phantom?: boolean
          claimed_at?: string | null
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      expenses: {
        Row: {
          id: string
          group_id: string
          name: string
          amount: number
          currency_code: string
          is_predefined: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          amount: number
          currency_code: string
          is_predefined?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          amount?: number
          currency_code?: string
          is_predefined?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_creator_must_be_member"
            columns: ["group_id", "created_by"]
            referencedRelation: "group_members"
            referencedColumns: ["group_id", "user_id"]
          }
        ]
      }
      invitations: {
        Row: {
          id: string
          group_id: string
          token: string
          created_by: string
          accepted_by: string | null
          consumed_at: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          token: string
          created_by: string
          accepted_by?: string | null
          consumed_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          token?: string
          created_by?: string
          accepted_by?: string | null
          consumed_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_group_id_fkey"
            columns: ["group_id"]
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_group: {
        Args: {
          p_name: string
          p_currency_code?: string
        }
        Returns: string
      }
      complete_onboarding: {
        Args: {
          p_pseudo: string
          p_income: number
          p_group_name: string
          p_expenses: Json
        }
        Returns: Json
      }
      leave_group: {
        Args: {
          p_group_id: string
        }
        Returns: Json
      }
      get_invitation_details: {
        Args: {
          p_token: string
        }
        Returns: Json
      }
      add_phantom_member: {
        Args: {
          p_group_id: string
          p_pseudo: string
          p_income: number
        }
        Returns: Json
      }
      remove_group_member: {
        Args: {
          p_group_id: string
          p_member_id: string
        }
        Returns: Json
      }
      get_group_members: {
        Args: {
          p_group_id: string
        }
        Returns: Json
      }
      generate_invitation: {
        Args: {
          p_group_id: string
        }
        Returns: Json
      }
      accept_invite: {
        Args: {
          p_token: string
        }
        Returns: Json
      }
      compute_shares: {
        Args: {
          p_group_id: string
        }
        Returns: Json
      }
      compute_shares: {
        Args: {
          p_group_id: string
        }
        Returns: Json
      }
      generate_invitation: {
        Args: {
          p_group_id: string
        }
        Returns: Json
      }
      accept_invite: {
        Args: {
          p_token: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type helpers for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific type exports for common usage
export type Profile = Tables<'profiles'>
export type Group = Tables<'groups'>
export type GroupMember = Tables<'group_members'>
export type Expense = Tables<'expenses'>
export type Invitation = Tables<'invitations'>

// RPC Function Return Types
export interface CompleteOnboardingResult {
  profile_id: string
  group_id: string
  shares: SharesResult
}

export interface AcceptInviteResult {
  group_id: string
  shares: SharesResult
}

export interface LeaveGroupResult {
  group_deleted: boolean
}

export interface InvitationDetails {
  group_name: string
  creator_pseudo: string
  expires_at: string | null
  is_consumed: boolean
}

export interface AddPhantomMemberResult {
  member_id: string
  shares: SharesResult
}

export interface RemoveGroupMemberResult {
  shares: SharesResult
}

export interface GenerateInvitationResult {
  token: string
  expires_at: string
}

export interface SharesResult {
  total_expenses: number
  shares: MemberShare[]
}

export interface MemberShare {
  member_id: string
  user_id: string | null
  pseudo: string
  share_percentage: number
  share_amount: number
}

export interface GroupMemberDetails {
  member_id: string
  user_id: string | null
  pseudo: string
  share_revenue: boolean
  income_or_weight: number | null
  joined_at: string
  is_phantom: boolean
}

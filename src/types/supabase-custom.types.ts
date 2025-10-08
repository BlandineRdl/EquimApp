/**
 * Custom types for Supabase RPC responses
 * These types are manually maintained and should NOT be overwritten by supabase gen types
 */

export interface MemberShare {
  member_id: string;
  user_id: string | null;
  pseudo: string;
  share_percentage: number;
  share_amount: number;
}

export interface SharesResult {
  total_expenses: number;
  shares: MemberShare[];
}

export interface GroupMemberDetails {
  member_id: string;
  user_id: string | null;
  pseudo: string;
  share_revenue: boolean;
  income_or_weight: number | null;
  joined_at: string;
  is_phantom: boolean;
}

export interface InvitationDetails {
  group_name: string;
  creator_pseudo: string;
  expires_at: string | null;
  is_consumed: boolean;
}

export interface AcceptInviteResult {
  group_id: string;
  shares: SharesResult;
}

export interface AddPhantomMemberResult {
  member_id: string;
  shares: SharesResult;
}

export interface RemoveGroupMemberResult {
  shares: SharesResult;
}

export interface LeaveGroupResult {
  group_deleted: boolean;
}

export interface GenerateInvitationResult {
  token: string;
  link: string;
}

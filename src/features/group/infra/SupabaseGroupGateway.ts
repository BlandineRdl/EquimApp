import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

import { logger } from "../../../lib/logger";
import { supabase } from "../../../lib/supabase/client";
import { createUserFriendlyError } from "../../../lib/supabase/errors";
import type { Database } from "../../../types/database.types";
import type {
  AcceptInviteResult,
  AddPhantomMemberResult,
  GenerateInvitationResult,
  GroupMemberDetails,
  InvitationDetails,
  LeaveGroupResult,
  MemberShare,
  RemoveGroupMemberResult,
  SharesResult,
} from "../../../types/supabase-custom.types";
import type {
  Expense,
  GroupFull,
  GroupGateway,
  GroupMember,
  GroupSummary,
  InvitationPreview,
  RealtimeCallbacks,
  Shares,
  Unsubscribe,
} from "../ports/GroupGateway";

// Type definitions for database query results
interface GroupMembershipQueryResult {
  group_id: string;
  groups: {
    id: string;
    name: string;
    currency_code: string;
    created_at: string;
  };
}

// Type definitions for realtime payloads
type ExpenseRealtimePayload = RealtimePostgresChangesPayload<
  Database["public"]["Tables"]["expenses"]["Row"]
>;

type GroupMemberRealtimePayload = RealtimePostgresChangesPayload<
  Database["public"]["Tables"]["group_members"]["Row"]
>;

export class SupabaseGroupGateway implements GroupGateway {
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();

  async createGroup(
    name: string,
    currency: string = "EUR",
  ): Promise<{ groupId: string }> {
    try {
      const { data, error } = await supabase.rpc("create_group", {
        p_name: name,
        p_currency_code: currency,
      });

      if (error) {
        throw createUserFriendlyError(error);
      }

      return { groupId: data as string };
    } catch (error) {
      throw createUserFriendlyError(error);
    }
  }

  async getGroupsByUserId(userId: string): Promise<GroupSummary[]> {
    try {
      logger.debug("Fetching groups for user", { userId });

      // Get all groups where user is a member
      const { data: groupMembers, error: membersError } = await supabase
        .from("group_members")
        .select(
          `
          group_id,
          groups!inner (
            id,
            name,
            currency_code,
            created_at
          )
        `,
        )
        .eq("user_id", userId);

      if (membersError) {
        logger.error("Error fetching group members", membersError);
        throw createUserFriendlyError(membersError);
      }

      logger.debug("Found group memberships", {
        count: groupMembers?.length || 0,
      });

      if (!groupMembers || groupMembers.length === 0) {
        logger.info("User is not member of any group");
        return [];
      }

      // For each group, get member count and total expenses
      const summaries: GroupSummary[] = await Promise.all(
        groupMembers.map(async (gm: GroupMembershipQueryResult) => {
          const groupId = gm.groups.id;

          // Count members
          const { count: memberCount } = await supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", groupId);

          // Sum expenses
          const { data: expenses } = await supabase
            .from("expenses")
            .select("amount")
            .eq("group_id", groupId);

          const totalExpenses =
            expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

          return {
            id: groupId,
            name: gm.groups.name,
            currency: gm.groups.currency_code,
            memberCount: memberCount || 0,
            totalExpenses,
            createdAt: gm.groups.created_at,
          };
        }),
      );

      return summaries;
    } catch (error) {
      throw createUserFriendlyError(error);
    }
  }

  async getGroupById(id: string): Promise<GroupFull> {
    try {
      // Get group basic info
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", id)
        .single();

      if (groupError) {
        throw createUserFriendlyError(groupError);
      }

      // Get members via RPC (bypasses RLS for pseudos)
      const { data: membersData, error: membersError } = await supabase.rpc(
        "get_group_members",
        {
          p_group_id: id,
        },
      );

      if (membersError) {
        throw createUserFriendlyError(membersError);
      }

      const members: GroupMember[] = (
        membersData as unknown as GroupMemberDetails[]
      ).map((m: GroupMemberDetails) => ({
        id: m.member_id,
        userId: m.user_id,
        pseudo: m.pseudo,
        shareRevenue: m.share_revenue,
        incomeOrWeight: m.income_or_weight,
        monthlyCapacity: m.monthly_capacity,
        joinedAt: m.joined_at,
        isPhantom: m.is_phantom || false,
      }));

      // Get expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("group_id", id)
        .order("created_at", { ascending: false });

      if (expensesError) {
        throw createUserFriendlyError(expensesError);
      }

      const expenses: Expense[] = (expensesData || []).map(
        (e: Database["public"]["Tables"]["expenses"]["Row"]) => ({
          id: e.id,
          groupId: e.group_id,
          name: e.name,
          amount: Number(e.amount),
          currency: e.currency_code,
          isPredefined: e.is_predefined,
          createdBy: e.created_by,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        }),
      );

      // Compute shares
      const shares = await this.refreshGroupShares(id);

      return {
        id: group.id,
        name: group.name,
        currency: group.currency_code,
        creatorId: group.creator_id,
        members,
        expenses,
        shares: shares.shares,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
      };
    } catch (error) {
      throw createUserFriendlyError(error);
    }
  }

  async createExpense(input: {
    groupId: string;
    name: string;
    amount: number;
    currency: string;
    isPredefined: boolean;
  }): Promise<{ expenseId: string; shares: Shares }> {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert expense
      const { data: expense, error } = await supabase
        .from("expenses")
        .insert({
          group_id: input.groupId,
          name: input.name,
          amount: input.amount,
          currency_code: input.currency,
          is_predefined: input.isPredefined,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        throw createUserFriendlyError(error);
      }

      // Compute updated shares
      const shares = await this.refreshGroupShares(input.groupId);

      return { expenseId: expense.id, shares: shares.shares };
    } catch (error) {
      throw createUserFriendlyError(error);
    }
  }

  async updateExpense(input: {
    expenseId: string;
    groupId: string;
    name?: string;
    amount?: number;
  }): Promise<{ shares: Shares }> {
    try {
      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.amount !== undefined) updates.amount = input.amount;

      const { error } = await supabase
        .from("expenses")
        .update(updates)
        .eq("id", input.expenseId);

      if (error) {
        throw createUserFriendlyError(error);
      }

      // Compute updated shares
      const shares = await this.refreshGroupShares(input.groupId);

      return { shares: shares.shares };
    } catch (error) {
      throw createUserFriendlyError(error);
    }
  }

  async deleteExpense(input: {
    expenseId: string;
    groupId: string;
  }): Promise<{ shares: Shares }> {
    try {
      const { error } = await supabase.rpc("delete_expense", {
        p_expense_id: input.expenseId,
      });

      if (error) {
        throw createUserFriendlyError(error);
      }

      // Compute updated shares
      const shares = await this.refreshGroupShares(input.groupId);

      return { shares: shares.shares };
    } catch (error) {
      throw createUserFriendlyError(error);
    }
  }

  async generateInvitation(
    groupId: string,
  ): Promise<{ token: string; link: string }> {
    try {
      // Call RPC to generate secure token server-side
      const { data, error } = await supabase.rpc("generate_invitation", {
        p_group_id: groupId,
      });

      if (error) {
        throw createUserFriendlyError(error);
      }

      const result = data as unknown as GenerateInvitationResult;
      if (!result || !result.token) {
        throw new Error("Token d'invitation non généré");
      }

      const token = result.token;
      const link = `equimapp://invite/${token}`;

      return { token, link };
    } catch (error) {
      throw createUserFriendlyError(error);
    }
  }

  async getInvitationDetails(token: string): Promise<InvitationPreview | null> {
    try {
      const { data, error } = await supabase.rpc("get_invitation_details", {
        p_token: token,
      });

      if (error) {
        throw createUserFriendlyError(error);
      }

      if (!data) {
        return null;
      }

      const preview = data as unknown as InvitationDetails;
      return {
        groupName: preview.group_name,
        creatorPseudo: preview.creator_pseudo,
        expiresAt: preview.expires_at,
        isConsumed: preview.is_consumed,
      };
    } catch (error) {
      logger.error("Error getting invitation details", error);
      return null;
    }
  }

  async acceptInvitation(
    token: string,
  ): Promise<{ groupId: string; shares: Shares }> {
    try {
      logger.debug("[Gateway] Calling accept_invite RPC", { token });
      const { data, error } = await supabase.rpc("accept_invite", {
        p_token: token,
      });

      if (error) {
        logger.error("[Gateway] RPC error", error);
        throw createUserFriendlyError(error);
      }

      logger.debug("[Gateway] RPC success", { data });
      const result = data as unknown as AcceptInviteResult;
      return {
        groupId: result.group_id,
        shares: {
          totalExpenses: result.shares.total_expenses,
          shares: result.shares.shares.map((s: MemberShare) => ({
            memberId: s.member_id,
            userId: s.user_id,
            pseudo: s.pseudo,
            sharePercentage: s.share_percentage,
            shareAmount: s.share_amount,
          })),
        },
      };
    } catch (error) {
      logger.error("[Gateway] Catch error", error);
      throw createUserFriendlyError(error);
    }
  }

  async addMember(
    groupId: string,
    userId: string,
  ): Promise<{ shares: Shares }> {
    try {
      // Add member
      const { error } = await supabase
        .from("group_members")
        .insert({ group_id: groupId, user_id: userId });

      if (error) {
        throw createUserFriendlyError(error);
      }

      // Compute updated shares
      const shares = await this.refreshGroupShares(groupId);

      return { shares: shares.shares };
    } catch (error) {
      throw createUserFriendlyError(error);
    }
  }

  async addPhantomMember(
    groupId: string,
    pseudo: string,
    income: number,
  ): Promise<{ memberId: string; shares: Shares }> {
    try {
      const { data, error } = await supabase.rpc("add_phantom_member", {
        p_group_id: groupId,
        p_pseudo: pseudo,
        p_income: income,
      });

      if (error) {
        throw createUserFriendlyError(error);
      }

      if (!data) {
        throw new Error("No data returned from add_phantom_member");
      }

      const result = data as unknown as AddPhantomMemberResult;
      return {
        memberId: result.member_id,
        shares: {
          totalExpenses: result.shares.total_expenses,
          shares: result.shares.shares.map((s: MemberShare) => ({
            memberId: s.member_id,
            userId: s.user_id,
            pseudo: s.pseudo,
            sharePercentage: s.share_percentage,
            shareAmount: s.share_amount,
          })),
        },
      };
    } catch (error) {
      throw createUserFriendlyError(error);
    }
  }

  async removeMember(
    groupId: string,
    memberId: string,
  ): Promise<{ shares: Shares }> {
    try {
      const { data, error } = await supabase.rpc("remove_group_member", {
        p_group_id: groupId,
        p_member_id: memberId,
      });

      if (error) {
        throw createUserFriendlyError(error);
      }

      if (!data) {
        throw new Error("No data returned from remove_group_member");
      }

      const result = data as unknown as RemoveGroupMemberResult;
      return {
        shares: {
          totalExpenses: result.shares.total_expenses,
          shares: result.shares.shares.map((s: MemberShare) => ({
            memberId: s.member_id,
            userId: s.user_id,
            pseudo: s.pseudo,
            sharePercentage: s.share_percentage,
            shareAmount: s.share_amount,
          })),
        },
      };
    } catch (error) {
      throw createUserFriendlyError(error);
    }
  }

  async leaveGroup(groupId: string): Promise<{ groupDeleted: boolean }> {
    try {
      const { data, error } = await supabase.rpc("leave_group", {
        p_group_id: groupId,
      });

      if (error) {
        throw createUserFriendlyError(error);
      }

      const result = data as unknown as LeaveGroupResult;
      return { groupDeleted: result.group_deleted };
    } catch (error) {
      throw createUserFriendlyError(error);
    }
  }

  async deleteGroup(groupId: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase.rpc("delete_group", {
        p_group_id: groupId,
      });

      if (error) {
        throw createUserFriendlyError(error);
      }

      return { success: true };
    } catch (error) {
      throw createUserFriendlyError(error);
    }
  }

  async refreshGroupShares(groupId: string): Promise<{ shares: Shares }> {
    try {
      const { data, error } = await supabase.rpc("compute_shares", {
        p_group_id: groupId,
      });

      if (error) {
        throw createUserFriendlyError(error);
      }

      const result = data as unknown as SharesResult;
      return {
        shares: {
          totalExpenses: result.total_expenses,
          shares: result.shares.map((s: MemberShare) => ({
            memberId: s.member_id,
            userId: s.user_id,
            pseudo: s.pseudo,
            sharePercentage: s.share_percentage,
            shareAmount: s.share_amount,
          })),
        },
      };
    } catch (error) {
      throw createUserFriendlyError(error);
    }
  }

  subscribe(groupId: string, callbacks: RealtimeCallbacks): Unsubscribe {
    const channelName = `group:${groupId}`;

    // Create channel
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "expenses",
          filter: `group_id=eq.${groupId}`,
        },
        (payload: ExpenseRealtimePayload) => {
          if (callbacks.onExpenseAdded && payload.new) {
            callbacks.onExpenseAdded({
              id: payload.new.id,
              groupId: payload.new.group_id,
              name: payload.new.name,
              amount: Number(payload.new.amount),
              currency: payload.new.currency_code,
              isPredefined: payload.new.is_predefined,
              createdBy: payload.new.created_by,
              createdAt: payload.new.created_at,
              updatedAt: payload.new.updated_at,
            });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "expenses",
          filter: `group_id=eq.${groupId}`,
        },
        (payload: ExpenseRealtimePayload) => {
          if (callbacks.onExpenseUpdated && payload.new) {
            callbacks.onExpenseUpdated({
              id: payload.new.id,
              groupId: payload.new.group_id,
              name: payload.new.name,
              amount: Number(payload.new.amount),
              currency: payload.new.currency_code,
              isPredefined: payload.new.is_predefined,
              createdBy: payload.new.created_by,
              createdAt: payload.new.created_at,
              updatedAt: payload.new.updated_at,
            });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "expenses",
          filter: `group_id=eq.${groupId}`,
        },
        (payload: ExpenseRealtimePayload) => {
          if (callbacks.onExpenseDeleted && payload.old) {
            callbacks.onExpenseDeleted(payload.old.id);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_members",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload: GroupMemberRealtimePayload) => {
          if (callbacks.onMemberAdded && payload.new) {
            // Handle phantom members
            if (payload.new.is_phantom) {
              callbacks.onMemberAdded({
                id: payload.new.id,
                userId: null,
                pseudo: payload.new.phantom_pseudo,
                shareRevenue: true,
                incomeOrWeight: payload.new.phantom_income,
                joinedAt: payload.new.joined_at,
                isPhantom: true,
              });
            } else {
              // Fetch member details for real users
              const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", payload.new.user_id)
                .single();

              if (profile) {
                callbacks.onMemberAdded({
                  id: payload.new.id,
                  userId: payload.new.user_id,
                  pseudo: profile.pseudo || "",
                  shareRevenue: profile.share_revenue,
                  incomeOrWeight:
                    profile.income_or_weight || profile.weight_override || 0,
                  joinedAt: payload.new.joined_at,
                  isPhantom: false,
                });
              }
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "group_members",
          filter: `group_id=eq.${groupId}`,
        },
        (payload: GroupMemberRealtimePayload) => {
          if (callbacks.onMemberRemoved && payload.old) {
            callbacks.onMemberRemoved(payload.old.user_id);
          }
        },
      )
      .subscribe();

    // Store channel reference
    this.realtimeChannels.set(channelName, channel);

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
      this.realtimeChannels.delete(channelName);
    };
  }
}

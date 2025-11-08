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
  UpdatePhantomMemberResult,
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

interface GroupMembershipQueryResult {
  group_id: string;
  groups: {
    id: string;
    name: string;
    currency_code: string;
    created_at: string;
  };
}

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

      const summaries: GroupSummary[] = await Promise.all(
        groupMembers.map(async (gm: GroupMembershipQueryResult) => {
          const groupId = gm.groups.id;

          const { count: memberCount } = await supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", groupId);

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
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", id)
        .single();

      if (groupError) {
        throw createUserFriendlyError(groupError);
      }

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

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
      const { error } = await supabase
        .from("group_members")
        .insert({ group_id: groupId, user_id: userId });

      if (error) {
        throw createUserFriendlyError(error);
      }

      const shares = await this.refreshGroupShares(groupId);

      return { shares: shares.shares };
    } catch (error) {
      throw createUserFriendlyError(error);
    }
  }

  async addPhantomMember(
    groupId: string,
    pseudo: string,
    income: number = 0,
  ): Promise<{ memberId: string; pseudo: string; shares: Shares }> {
    try {
      const { data, error } = await supabase.rpc("add_phantom_member", {
        p_group_id: groupId,
        p_suffix: pseudo,
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
        pseudo: result.pseudo,
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

  async updatePhantomMember(
    memberId: string,
    newPseudo: string,
    newIncome?: number,
  ): Promise<{ memberId: string; pseudo: string; shares: Shares }> {
    try {
      const { data, error } = await supabase.rpc("update_phantom_member", {
        p_member_id: memberId,
        p_new_pseudo: newPseudo,
        p_new_income: newIncome,
      });

      if (error) {
        throw createUserFriendlyError(error);
      }

      if (!data) {
        throw new Error("No data returned from update_phantom_member");
      }

      const result = data as unknown as UpdatePhantomMemberResult;
      return {
        memberId: result.member_id,
        pseudo: result.pseudo,
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
          if (callbacks.onExpenseAdded && payload.new && "id" in payload.new) {
            const expense = payload.new;
            callbacks.onExpenseAdded({
              id: expense.id,
              groupId: expense.group_id,
              name: expense.name,
              amount: Number(expense.amount),
              currency: expense.currency_code,
              isPredefined: expense.is_predefined,
              createdBy: expense.created_by,
              createdAt: expense.created_at,
              updatedAt: expense.updated_at,
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
          if (
            callbacks.onExpenseUpdated &&
            payload.new &&
            "id" in payload.new
          ) {
            const expense = payload.new;
            callbacks.onExpenseUpdated({
              id: expense.id,
              groupId: expense.group_id,
              name: expense.name,
              amount: Number(expense.amount),
              currency: expense.currency_code,
              isPredefined: expense.is_predefined,
              createdBy: expense.created_by,
              createdAt: expense.created_at,
              updatedAt: expense.updated_at,
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
          if (
            callbacks.onExpenseDeleted &&
            payload.old &&
            "id" in payload.old &&
            payload.old.id
          ) {
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
          if (callbacks.onMemberAdded && payload.new && "id" in payload.new) {
            const member = payload.new;
            if (member.is_phantom) {
              const phantomPseudo = member.phantom_pseudo as string;
              const phantomIncome = member.phantom_income as number;
              callbacks.onMemberAdded({
                id: member.id,
                userId: null,
                pseudo: phantomPseudo,
                shareRevenue: true,
                incomeOrWeight: phantomIncome,
                monthlyCapacity: phantomIncome,
                joinedAt: member.joined_at,
                isPhantom: true,
              });
            } else {
              const userId = member.user_id as string;
              const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

              if (profile) {
                callbacks.onMemberAdded({
                  id: member.id,
                  userId: userId,
                  pseudo: profile.pseudo || "",
                  shareRevenue: profile.share_revenue,
                  incomeOrWeight:
                    profile.income_or_weight || profile.weight_override || 0,
                  monthlyCapacity: profile.monthly_capacity,
                  joinedAt: member.joined_at,
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
          if (
            callbacks.onMemberRemoved &&
            payload.old &&
            "user_id" in payload.old &&
            payload.old.user_id
          ) {
            callbacks.onMemberRemoved(payload.old.user_id);
          }
        },
      )
      .subscribe();

    this.realtimeChannels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.realtimeChannels.delete(channelName);
    };
  }
}

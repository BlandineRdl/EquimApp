/**
 * In-Memory Group Gateway for tests
 * Implements the new GroupGateway interface with full validation
 */

import { MIN_PSEUDO_LENGTH } from "../domain/group.constants";
import type {
  Expense,
  GroupFull,
  GroupGateway,
  GroupMember,
  GroupSummary,
  InvitationPreview,
  MemberShare,
  RealtimeCallbacks,
  Shares,
  Unsubscribe,
} from "../ports/GroupGateway";

interface InvitationData {
  token: string;
  groupId: string;
  createdBy: string;
  expiresAt: string | null;
  isConsumed: boolean;
  consumedBy?: string;
}

export class InMemoryGroupGateway implements GroupGateway {
  private groups: Map<string, GroupFull> = new Map();
  private expenses: Map<string, Expense> = new Map();
  private invitations: Map<string, InvitationData> = new Map();
  private members: Map<string, GroupMember[]> = new Map();
  private tokenCounter = 0;
  private expenseCounter = 0;
  private memberCounter = 0;

  async createGroup(
    name: string,
    currency: string = "EUR",
  ): Promise<{ groupId: string }> {
    const groupId = `group-${Date.now()}-${Math.random()}`;
    this.groups.set(groupId, {
      id: groupId,
      name,
      currency,
      creatorId: "current-user",
      members: [],
      expenses: [],
      shares: { totalExpenses: 0, shares: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    this.members.set(groupId, []);
    return { groupId };
  }

  async getGroupsByUserId(userId: string): Promise<GroupSummary[]> {
    const summaries: GroupSummary[] = [];
    for (const [groupId, group] of this.groups.entries()) {
      const members = this.members.get(groupId) || [];
      if (members.some((m) => m.userId === userId)) {
        const groupExpenses = Array.from(this.expenses.values()).filter(
          (e) => e.groupId === groupId,
        );
        const totalExpenses = groupExpenses.reduce(
          (sum, e) => sum + e.amount,
          0,
        );

        summaries.push({
          id: group.id,
          name: group.name,
          currency: group.currency,
          memberCount: members.length,
          totalExpenses,
          createdAt: group.createdAt,
        });
      }
    }
    return summaries;
  }

  async getGroupById(id: string): Promise<GroupFull> {
    const group = this.groups.get(id);
    if (!group) throw new Error("Groupe non trouvé");

    const members = this.members.get(id) || [];
    const groupExpenses = Array.from(this.expenses.values()).filter(
      (e) => e.groupId === id,
    );
    const { shares } = await this.refreshGroupShares(id);

    return {
      id: group.id,
      name: group.name,
      currency: group.currency,
      creatorId: group.creatorId,
      members,
      expenses: groupExpenses,
      shares,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  async createExpense(input: {
    groupId: string;
    name: string;
    amount: number;
    currency: string;
    isPredefined: boolean;
  }): Promise<{ expenseId: string; shares: Shares }> {
    // Validate group exists
    if (!this.groups.has(input.groupId)) {
      throw new Error("Groupe non trouvé");
    }

    // Validate name
    if (!input.name.trim()) {
      throw new Error("Le nom de la dépense ne peut pas être vide");
    }

    // Validate amount
    if (input.amount <= 0) {
      throw new Error("Le montant doit être supérieur à 0");
    }

    const expenseId = `expense-${Date.now()}-${++this.expenseCounter}`;
    const expense: Expense = {
      id: expenseId,
      groupId: input.groupId,
      name: input.name.trim(),
      amount: input.amount,
      currency: input.currency,
      isPredefined: input.isPredefined,
      createdBy: "current-user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.expenses.set(expenseId, expense);

    const { shares } = await this.refreshGroupShares(input.groupId);
    return { expenseId, shares };
  }

  async updateExpense(input: {
    expenseId: string;
    groupId: string;
    name?: string;
    amount?: number;
  }): Promise<{ shares: Shares }> {
    const expense = this.expenses.get(input.expenseId);
    if (!expense) throw new Error("Dépense non trouvée");

    if (input.name !== undefined) expense.name = input.name;
    if (input.amount !== undefined) expense.amount = input.amount;
    expense.updatedAt = new Date().toISOString();

    return await this.refreshGroupShares(input.groupId);
  }

  async deleteExpense(input: {
    expenseId: string;
    groupId: string;
  }): Promise<{ shares: Shares }> {
    this.expenses.delete(input.expenseId);
    return await this.refreshGroupShares(input.groupId);
  }

  async generateInvitation(
    groupId: string,
  ): Promise<{ token: string; link: string }> {
    // Validate group exists
    if (!this.groups.has(groupId)) {
      throw new Error("Groupe non trouvé");
    }

    const token = `invite-${Date.now()}-${++this.tokenCounter}`;
    this.invitations.set(token, {
      token,
      groupId,
      createdBy: "current-user",
      expiresAt: null,
      isConsumed: false,
    });
    return { token, link: `equimapp://invite/${token}` };
  }

  async getInvitationDetails(token: string): Promise<InvitationPreview | null> {
    // Validate token
    if (!token || !token.trim()) {
      throw new Error("Token d'invitation invalide");
    }

    const invitation = this.invitations.get(token.trim());
    if (!invitation) return null;

    const group = this.groups.get(invitation.groupId);
    if (!group) return null;

    return {
      groupName: group.name,
      creatorPseudo: "Test User",
      expiresAt: invitation.expiresAt,
      isConsumed: invitation.isConsumed,
    };
  }

  async acceptInvitation(
    token: string,
  ): Promise<{ groupId: string; memberId?: string; shares: Shares }> {
    const invitation = this.invitations.get(token);
    if (!invitation || !token.trim())
      throw new Error("Token d'invitation invalide");
    if (invitation.isConsumed) throw new Error("Invitation déjà utilisée");

    invitation.isConsumed = true;

    // Add member
    const members = this.members.get(invitation.groupId) || [];
    const memberId = `member-${Date.now()}`;
    members.push({
      id: memberId,
      userId: "new-user",
      pseudo: "New Member",
      shareRevenue: true,
      incomeOrWeight: 1000,
      monthlyCapacity: 1000,
      joinedAt: new Date().toISOString(),
    });
    this.members.set(invitation.groupId, members);

    const { shares } = await this.refreshGroupShares(invitation.groupId);
    return { groupId: invitation.groupId, memberId, shares };
  }

  async addMember(
    groupId: string,
    userId: string,
  ): Promise<{ shares: Shares }> {
    const members = this.members.get(groupId) || [];
    if (!members.some((m) => m.userId === userId)) {
      members.push({
        id: `member-${Date.now()}`,
        userId,
        pseudo: `User-${userId}`,
        shareRevenue: true,
        incomeOrWeight: 1000,
        monthlyCapacity: 1000,
        joinedAt: new Date().toISOString(),
      });
      this.members.set(groupId, members);
    }

    return await this.refreshGroupShares(groupId);
  }

  async addPhantomMember(
    groupId: string,
    pseudo: string,
    income: number,
  ): Promise<{ memberId: string; shares: Shares }> {
    // Validate pseudo
    if (!pseudo.trim()) {
      throw new Error("Le pseudo ne peut pas être vide");
    }

    if (pseudo.trim().length < MIN_PSEUDO_LENGTH) {
      throw new Error(
        `Le pseudo doit contenir au moins ${MIN_PSEUDO_LENGTH} caractères`,
      );
    }

    // Validate income
    if (income <= 0) {
      throw new Error("Le revenu mensuel doit être positif");
    }

    const members = this.members.get(groupId) || [];
    const memberId = `phantom-${++this.memberCounter}`;

    members.push({
      id: memberId,
      userId: null,
      pseudo: pseudo.trim(),
      shareRevenue: true,
      incomeOrWeight: income,
      monthlyCapacity: income,
      joinedAt: new Date().toISOString(),
      isPhantom: true,
    });
    this.members.set(groupId, members);

    const { shares } = await this.refreshGroupShares(groupId);
    return { memberId, shares };
  }

  async removeMember(
    groupId: string,
    memberId: string,
  ): Promise<{ shares: Shares }> {
    // Validate inputs
    if (!groupId.trim()) {
      throw new Error("ID de groupe invalide");
    }

    if (!memberId.trim()) {
      throw new Error("ID de membre invalide");
    }

    // Check group exists
    if (!this.groups.has(groupId)) {
      throw new Error("Groupe non trouvé");
    }

    const members = this.members.get(groupId) || [];

    // Check member exists
    const memberExists = members.some((m) => m.id === memberId);
    if (!memberExists) {
      throw new Error("Membre non trouvé");
    }

    // Remove by member ID (not userId)
    const filtered = members.filter((m) => m.id !== memberId);
    this.members.set(groupId, filtered);

    return await this.refreshGroupShares(groupId);
  }

  async leaveGroup(groupId: string): Promise<{ groupDeleted: boolean }> {
    // Check group exists
    if (!this.groups.has(groupId)) {
      throw new Error("Groupe non trouvé");
    }

    const members = this.members.get(groupId) || [];

    // In memory implementation: remove the last added member (simulates current user)
    // In real implementation, Supabase gets current user from auth context
    if (members.length === 0) {
      throw new Error("Aucun membre à retirer");
    }

    // Remove last member (simulates current user leaving)
    const filtered = members.slice(0, -1);

    if (filtered.length === 0) {
      // Delete group when last member leaves
      this.groups.delete(groupId);
      this.members.delete(groupId);
      // Delete expenses
      for (const [expenseId, expense] of this.expenses.entries()) {
        if (expense.groupId === groupId) {
          this.expenses.delete(expenseId);
        }
      }
      return { groupDeleted: true };
    }

    this.members.set(groupId, filtered);
    return { groupDeleted: false };
  }

  async deleteGroup(groupId: string): Promise<{ success: boolean }> {
    // Check group exists
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error("Groupe non trouvé");
    }

    // Delete all members
    this.members.delete(groupId);

    // Delete all expenses
    for (const [expenseId, expense] of this.expenses.entries()) {
      if (expense.groupId === groupId) {
        this.expenses.delete(expenseId);
      }
    }

    // Delete group
    this.groups.delete(groupId);

    return { success: true };
  }

  async refreshGroupShares(groupId: string): Promise<{ shares: Shares }> {
    const members = this.members.get(groupId) || [];
    const groupExpenses = Array.from(this.expenses.values()).filter(
      (e) => e.groupId === groupId,
    );

    const totalExpenses = groupExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalWeight = members.reduce(
      (sum, m) => sum + (m.incomeOrWeight || 0),
      0,
    );

    const memberShares: MemberShare[] = members.map((m) => {
      const weight = m.incomeOrWeight || 0;
      const sharePercentage =
        totalWeight > 0 ? (weight / totalWeight) * 100 : 0;
      const shareAmount =
        totalWeight > 0 ? (weight / totalWeight) * totalExpenses : 0;

      return {
        memberId: m.id,
        userId: m.userId,
        pseudo: m.pseudo,
        sharePercentage: Math.round(sharePercentage * 100) / 100,
        shareAmount: Math.round(shareAmount * 100) / 100,
      };
    });

    return {
      shares: {
        totalExpenses,
        shares: memberShares,
      },
    };
  }

  subscribe(_groupId: string, _callbacks: RealtimeCallbacks): Unsubscribe {
    // Mock subscription
    return () => {
      // Unsubscribe
    };
  }

  // Helper for tests
  reset() {
    this.groups.clear();
    this.expenses.clear();
    this.invitations.clear();
    this.members.clear();
    this.tokenCounter = 0;
    this.expenseCounter = 0;
  }
}

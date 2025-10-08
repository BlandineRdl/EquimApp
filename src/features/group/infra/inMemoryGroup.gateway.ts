/**
 * In-Memory Group Gateway for tests
 * Implements the new GroupGateway interface
 */

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

export class InMemoryGroupGateway implements GroupGateway {
	private groups: Map<string, any> = new Map();
	private expenses: Map<string, Expense> = new Map();
	private invitations: Map<string, any> = new Map();
	private members: Map<string, GroupMember[]> = new Map();

	async createGroup(
		name: string,
		currency: string = "EUR",
	): Promise<{ groupId: string }> {
		const groupId = `group-${Date.now()}`;
		this.groups.set(groupId, {
			id: groupId,
			name,
			currency,
			creatorId: "current-user",
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
				const totalExpenses = groupExpenses.reduce((sum, e) => sum + e.amount, 0);

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
		if (!group) throw new Error("Group not found");

		const members = this.members.get(id) || [];
		const groupExpenses = Array.from(this.expenses.values()).filter(
			(e) => e.groupId === id,
		);
		const shares = await this.refreshGroupShares(id);

		return {
			id: group.id,
			name: group.name,
			currency: group.currency,
			creatorId: group.creatorId,
			members,
			expenses: groupExpenses,
			shares: shares.shares,
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
		const expenseId = `expense-${Date.now()}`;
		const expense: Expense = {
			id: expenseId,
			groupId: input.groupId,
			name: input.name,
			amount: input.amount,
			currency: input.currency,
			isPredefined: input.isPredefined,
			createdBy: "current-user",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		this.expenses.set(expenseId, expense);

		const shares = await this.refreshGroupShares(input.groupId);
		return { expenseId, shares: shares.shares };
	}

	async updateExpense(input: {
		expenseId: string;
		groupId: string;
		name?: string;
		amount?: number;
	}): Promise<{ shares: Shares }> {
		const expense = this.expenses.get(input.expenseId);
		if (!expense) throw new Error("Expense not found");

		if (input.name !== undefined) expense.name = input.name;
		if (input.amount !== undefined) expense.amount = input.amount;
		expense.updatedAt = new Date().toISOString();

		const shares = await this.refreshGroupShares(input.groupId);
		return { shares: shares.shares };
	}

	async deleteExpense(input: {
		expenseId: string;
		groupId: string;
	}): Promise<{ shares: Shares }> {
		this.expenses.delete(input.expenseId);
		const shares = await this.refreshGroupShares(input.groupId);
		return { shares: shares.shares };
	}

	async generateInvitation(
		groupId: string,
	): Promise<{ token: string; link: string }> {
		const token = `invite-${Date.now()}`;
		this.invitations.set(token, {
			groupId,
			createdBy: "current-user",
			expiresAt: null,
			isConsumed: false,
		});
		return { token, link: `equimapp://invite/${token}` };
	}

	async getInvitationDetails(
		token: string,
	): Promise<InvitationPreview | null> {
		const invitation = this.invitations.get(token);
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
	): Promise<{ groupId: string; shares: Shares }> {
		const invitation = this.invitations.get(token);
		if (!invitation) throw new Error("Invalid token");
		if (invitation.isConsumed) throw new Error("Already consumed");

		invitation.isConsumed = true;

		// Add member
		await this.addMember(invitation.groupId, "current-user");

		const shares = await this.refreshGroupShares(invitation.groupId);
		return { groupId: invitation.groupId, shares: shares.shares };
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
				joinedAt: new Date().toISOString(),
			});
			this.members.set(groupId, members);
		}

		const shares = await this.refreshGroupShares(groupId);
		return { shares: shares.shares };
	}

	async addPhantomMember(
		groupId: string,
		pseudo: string,
		income: number,
	): Promise<{ memberId: string; shares: Shares }> {
		const members = this.members.get(groupId) || [];
		const memberId = `phantom-${Date.now()}`;

		members.push({
			id: memberId,
			userId: null,
			pseudo,
			shareRevenue: true,
			incomeOrWeight: income,
			joinedAt: new Date().toISOString(),
			isPhantom: true,
		});
		this.members.set(groupId, members);

		const shares = await this.refreshGroupShares(groupId);
		return { memberId, shares: shares.shares };
	}

	async removeMember(
		groupId: string,
		userId: string,
	): Promise<{ shares: Shares }> {
		const members = this.members.get(groupId) || [];
		const filtered = members.filter((m) => m.userId !== userId);
		this.members.set(groupId, filtered);

		const shares = await this.refreshGroupShares(groupId);
		return { shares: shares.shares };
	}

	async leaveGroup(groupId: string): Promise<{ groupDeleted: boolean }> {
		const members = this.members.get(groupId) || [];
		const filtered = members.filter((m) => m.userId !== "current-user");

		if (filtered.length === 0) {
			// Delete group
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

	subscribe(groupId: string, callbacks: RealtimeCallbacks): Unsubscribe {
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
	}
}

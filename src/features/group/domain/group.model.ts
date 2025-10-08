import type { GroupMember as GatewayGroupMember, Shares, Expense as GatewayExpense } from "../ports/GroupGateway";

// Domain group member - matches gateway interface
export type GroupMember = GatewayGroupMember;

// Domain expense - matches gateway interface
export type Expense = GatewayExpense;

// Domain group - enriched with computed fields
export interface Group {
  id: string;
  name: string;
  currency: string;
  creatorId: string;
  members: GroupMember[];
  expenses: Expense[];
  shares: Shares;
  totalMonthlyBudget: number; // Computed from shares.totalExpenses
  createdAt: string;
  updatedAt: string;
}

export interface InvitationDetails {
  groupId: string;
  groupName: string;
  createdBy: string;
}

import type { Expense } from "../../onboarding/domain/expense.model";

export interface GroupMember {
  id: string;
  pseudo: string;
  monthlyIncome: number;
}

export interface Group {
  id: string;
  name: string;
  expenses: Expense[];
  totalMonthlyBudget: number;
  members: GroupMember[];
}

export interface InvitationDetails {
  groupId: string;
  groupName: string;
  createdBy: string;
}

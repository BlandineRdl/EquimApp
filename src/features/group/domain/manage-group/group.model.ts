import type {
  Expense as GatewayExpense,
  GroupMember as GatewayGroupMember,
  Shares,
} from "../../ports/GroupGateway";

export type GroupMember = GatewayGroupMember;

export type Expense = GatewayExpense;

export interface Group {
  id: string;
  name: string;
  currency: string;
  creatorId: string;
  members: GroupMember[];
  expenses: Expense[];
  shares: Shares;
  totalMonthlyBudget: number;
  createdAt: string;
  updatedAt: string;
}

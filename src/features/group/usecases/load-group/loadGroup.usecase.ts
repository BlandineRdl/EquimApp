import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import type {
  Expense,
  GroupGateway,
  GroupMember,
  Shares,
} from "../../ports/GroupGateway";

export const loadGroupById = createAsyncThunk<
  {
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
  },
  string,
  {
    state: AppState;
    extra: { groupGateway: GroupGateway };
  }
>("groups/loadGroupById", async (groupId, { extra: { groupGateway } }) => {
  const group = await groupGateway.getGroupById(groupId);

  return {
    id: group.id,
    name: group.name,
    currency: group.currency,
    creatorId: group.creatorId,
    members: group.members,
    expenses: group.expenses,
    shares: group.shares,
    totalMonthlyBudget: group.shares.totalExpenses,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
});

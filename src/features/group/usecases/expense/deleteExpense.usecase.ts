import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import type { GroupGateway, Shares } from "../../ports/GroupGateway";

export interface DeleteExpenseInput {
  groupId: string;
  expenseId: string;
}

export const deleteExpense = createAsyncThunk<
  {
    groupId: string;
    expenseId: string;
    shares: Shares;
  },
  DeleteExpenseInput,
  {
    state: AppState;
    extra: { groupGateway: GroupGateway };
  }
>(
  "groups/deleteExpense",
  async ({ groupId, expenseId }, { getState, extra: { groupGateway } }) => {
    // Validate: group exists in state
    const state = getState();
    const group = state.groups.entities[groupId];
    if (!group) {
      throw new Error("Groupe non trouvé");
    }

    // Validate: expense exists
    const expense = group.expenses?.find((e) => e.id === expenseId);
    if (!expense) {
      throw new Error("Dépense non trouvée");
    }

    // Delete expense via gateway
    const result = await groupGateway.deleteExpense({
      expenseId,
      groupId,
    });

    return {
      groupId,
      expenseId,
      shares: result.shares,
    };
  },
);

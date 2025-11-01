import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../../types/thunk.types";
import type { Shares } from "../../ports/GroupGateway";

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
  AppThunkApiConfig
>(
  "groups/deleteExpense",
  async (
    { groupId, expenseId },
    { getState, extra: { groupGateway }, rejectWithValue },
  ) => {
    // Validate: group exists in state
    const state = getState();
    const group = state.groups.entities[groupId];
    if (!group) {
      return rejectWithValue({
        code: "GROUP_NOT_FOUND",
        message: "Groupe non trouvé",
        details: { groupId },
      });
    }

    // Validate: expense exists
    const expense = group.expenses?.find((e) => e.id === expenseId);
    if (!expense) {
      return rejectWithValue({
        code: "EXPENSE_NOT_FOUND",
        message: "Dépense non trouvée",
        details: { groupId, expenseId },
      });
    }

    try {
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
    } catch (error) {
      return rejectWithValue({
        code: "DELETE_EXPENSE_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression de la dépense",
        details: { groupId, expenseId },
      });
    }
  },
);

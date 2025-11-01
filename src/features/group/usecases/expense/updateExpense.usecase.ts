import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../../types/thunk.types";
import type { Shares } from "../../ports/GroupGateway";

export interface UpdateExpenseInput {
  groupId: string;
  expenseId: string;
  name: string;
  amount: number;
}

export const updateExpense = createAsyncThunk<
  {
    groupId: string;
    expenseId: string;
    name: string;
    amount: number;
    shares: Shares;
  },
  UpdateExpenseInput,
  AppThunkApiConfig
>(
  "groups/updateExpense",
  async (
    { groupId, expenseId, name, amount },
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
    const expense = group.expenses.find((exp) => exp.id === expenseId);
    if (!expense) {
      return rejectWithValue({
        code: "EXPENSE_NOT_FOUND",
        message: "Dépense non trouvée",
        details: { groupId, expenseId },
      });
    }

    // Validate input
    if (!name.trim()) {
      return rejectWithValue({
        code: "EMPTY_EXPENSE_NAME",
        message: "Le nom de la dépense ne peut pas être vide",
        details: { name },
      });
    }

    if (amount <= 0) {
      return rejectWithValue({
        code: "INVALID_AMOUNT",
        message: "Le montant doit être supérieur à 0",
        details: { amount },
      });
    }

    try {
      // Update expense via gateway
      const result = await groupGateway.updateExpense({
        groupId,
        expenseId,
        name: name.trim(),
        amount,
      });

      return {
        groupId,
        expenseId,
        name: name.trim(),
        amount,
        shares: result.shares,
      };
    } catch (error) {
      return rejectWithValue({
        code: "UPDATE_EXPENSE_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la mise à jour de la dépense",
        details: { groupId, expenseId, name: name.trim(), amount },
      });
    }
  },
);

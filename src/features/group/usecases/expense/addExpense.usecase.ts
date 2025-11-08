import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../../types/thunk.types";
import type { Shares } from "../../ports/GroupGateway";

export interface AddExpenseInput {
  groupId: string;
  name: string;
  amount: number;
}

export const addExpenseToGroup = createAsyncThunk<
  {
    groupId: string;
    expense: {
      id: string;
      groupId: string;
      name: string;
      amount: number;
      currency: string;
      isPredefined: boolean;
      createdBy: string;
      createdAt: string;
      updatedAt: string;
    };
    shares: Shares;
  },
  AddExpenseInput,
  AppThunkApiConfig
>(
  "groups/addExpense",
  async (
    { groupId, name, amount },
    { getState, extra: { groupGateway }, rejectWithValue },
  ) => {
    const state = getState();
    const group = state.groups.entities[groupId];
    if (!group) {
      return rejectWithValue({
        code: "GROUP_NOT_FOUND",
        message: "Groupe non trouvé",
        details: { groupId },
      });
    }

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
      const result = await groupGateway.createExpense({
        groupId,
        name: name.trim(),
        amount,
        currency: group.currency,
        isPredefined: false,
      });

      const currentUserId = state.auth.user?.id || "";

      return {
        groupId,
        expense: {
          id: result.expenseId,
          groupId,
          name: name.trim(),
          amount,
          currency: group.currency,
          isPredefined: false,
          createdBy: currentUserId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        shares: result.shares,
      };
    } catch (error) {
      return rejectWithValue({
        code: "ADD_EXPENSE_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'ajout de la dépense",
        details: { groupId, name: name.trim(), amount },
      });
    }
  },
);

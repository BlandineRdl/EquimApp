import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import type { GroupGateway } from "../../ports/GroupGateway";

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
    shares: any;
  },
  AddExpenseInput,
  {
    state: AppState;
    extra: { groupGateway: GroupGateway };
  }
>(
  "groups/addExpense",
  async ({ groupId, name, amount }, { getState, extra: { groupGateway } }) => {
    // Validate: group exists in state
    const state = getState();
    const group = state.groups.entities[groupId];
    if (!group) {
      throw new Error("Groupe non trouvé");
    }

    // Validate input
    if (!name.trim()) {
      throw new Error("Le nom de la dépense ne peut pas être vide");
    }

    if (amount <= 0) {
      throw new Error("Le montant doit être supérieur à 0");
    }

    // Create expense via gateway
    const result = await groupGateway.createExpense({
      groupId,
      name: name.trim(),
      amount,
      currency: group.currency,
      isPredefined: false,
    });

    // Get current user ID (assuming it's stored in auth state)
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
  },
);

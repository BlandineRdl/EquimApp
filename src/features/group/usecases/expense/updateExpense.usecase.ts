import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import type { GroupGateway, Shares } from "../../ports/GroupGateway";

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
  {
    state: AppState;
    extra: { groupGateway: GroupGateway };
  }
>(
  "groups/updateExpense",
  async (
    { groupId, expenseId, name, amount },
    { getState, extra: { groupGateway } },
  ) => {
    // Validate: group exists in state
    const state = getState();
    const group = state.groups.entities[groupId];
    if (!group) {
      throw new Error("Groupe non trouvé");
    }

    // Validate: expense exists
    const expense = group.expenses.find((exp) => exp.id === expenseId);
    if (!expense) {
      throw new Error("Dépense non trouvée");
    }

    // Validate input
    if (!name.trim()) {
      throw new Error("Le nom de la dépense ne peut pas être vide");
    }

    if (amount <= 0) {
      throw new Error("Le montant doit être supérieur à 0");
    }

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
  },
);

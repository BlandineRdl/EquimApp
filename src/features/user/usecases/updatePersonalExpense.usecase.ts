import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../types/thunk.types";
import type { PersonalExpense } from "../domain/manage-personal-expenses/personal-expense";
import { validateExpense } from "../domain/manage-personal-expenses/validate-expense";
import type { PersonalExpenseUpdate } from "../ports/UserGateway";

export const updatePersonalExpense = createAsyncThunk<
  PersonalExpense, // Return the updated expense
  PersonalExpenseUpdate,
  AppThunkApiConfig
>(
  "user/updatePersonalExpense",
  async (expense, { rejectWithValue, extra, getState }) => {
    try {
      // Validate expense
      validateExpense(expense.label, expense.amount);

      // Get current user ID
      const state = getState();
      const userId = state.auth?.user?.id;

      if (!userId) {
        return rejectWithValue({
          code: "USER_NOT_AUTHENTICATED",
          message: "User not authenticated",
        });
      }

      // Update expense via gateway
      const updatedExpense = await extra.userGateway.updatePersonalExpense(
        userId,
        expense,
      );

      // Return the updated expense so the reducer can update it in state
      return updatedExpense;
    } catch (error) {
      return rejectWithValue({
        code: "UPDATE_PERSONAL_EXPENSE_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Failed to update personal expense",
        details: {
          id: expense.id,
          label: expense.label,
          amount: expense.amount,
        },
      });
    }
  },
);

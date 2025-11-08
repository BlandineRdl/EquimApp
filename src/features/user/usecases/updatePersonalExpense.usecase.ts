import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../types/thunk.types";
import type { PersonalExpense } from "../domain/manage-personal-expenses/personal-expense";
import { validateExpense } from "../domain/manage-personal-expenses/validate-expense";
import type { PersonalExpenseUpdate } from "../ports/UserGateway";

export const updatePersonalExpense = createAsyncThunk<
  PersonalExpense,
  PersonalExpenseUpdate,
  AppThunkApiConfig
>(
  "user/updatePersonalExpense",
  async (expense, { rejectWithValue, extra, getState }) => {
    try {
      validateExpense(expense.label, expense.amount);

      const state = getState();
      const userId = state.auth?.user?.id;

      if (!userId) {
        return rejectWithValue({
          code: "USER_NOT_AUTHENTICATED",
          message: "User not authenticated",
        });
      }

      const updatedExpense = await extra.userGateway.updatePersonalExpense(
        userId,
        expense,
      );

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

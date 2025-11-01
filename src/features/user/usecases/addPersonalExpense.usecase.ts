import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../types/thunk.types";
import type { PersonalExpense } from "../domain/manage-personal-expenses/personal-expense";
import { validateExpense } from "../domain/manage-personal-expenses/validate-expense";
import type { NewPersonalExpense } from "../ports/UserGateway";

export const addPersonalExpense = createAsyncThunk<
  PersonalExpense, // Return the created expense
  NewPersonalExpense,
  AppThunkApiConfig
>(
  "user/addPersonalExpense",
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

      // Add expense via gateway
      const createdExpense = await extra.userGateway.addPersonalExpense(
        userId,
        expense,
      );

      // Return the created expense so the reducer can add it to state
      return createdExpense;
    } catch (error) {
      return rejectWithValue({
        code: "ADD_PERSONAL_EXPENSE_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Failed to add personal expense",
        details: { label: expense.label, amount: expense.amount },
      });
    }
  },
);

import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../types/thunk.types";

export const deletePersonalExpense = createAsyncThunk<
  string, // Return the expenseId that was deleted
  string,
  AppThunkApiConfig
>(
  "user/deletePersonalExpense",
  async (expenseId, { rejectWithValue, extra, getState }) => {
    try {
      // Get current user ID
      const state = getState();
      const userId = state.auth?.user?.id;

      if (!userId) {
        return rejectWithValue({
          code: "USER_NOT_AUTHENTICATED",
          message: "User not authenticated",
        });
      }

      // Delete expense via gateway
      await extra.userGateway.deletePersonalExpense(userId, expenseId);

      // Return the expenseId so the reducer can remove it from state
      return expenseId;
    } catch (error) {
      return rejectWithValue({
        code: "DELETE_PERSONAL_EXPENSE_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete personal expense",
        details: { expenseId },
      });
    }
  },
);

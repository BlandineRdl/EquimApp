import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../types/thunk.types";

export const deletePersonalExpense = createAsyncThunk<
  string,
  string,
  AppThunkApiConfig
>(
  "user/deletePersonalExpense",
  async (expenseId, { rejectWithValue, extra, getState }) => {
    try {
      const state = getState();
      const userId = state.auth?.user?.id;

      if (!userId) {
        return rejectWithValue({
          code: "USER_NOT_AUTHENTICATED",
          message: "User not authenticated",
        });
      }

      await extra.userGateway.deletePersonalExpense(userId, expenseId);

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

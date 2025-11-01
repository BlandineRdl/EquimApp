import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../types/thunk.types";
import type { PersonalExpense } from "../domain/manage-personal-expenses/personal-expense";

export const loadPersonalExpenses = createAsyncThunk<
  PersonalExpense[],
  void,
  AppThunkApiConfig
>(
  "user/loadPersonalExpenses",
  async (_, { rejectWithValue, extra, getState }) => {
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

      // Load expenses via gateway
      return await extra.userGateway.loadPersonalExpenses(userId);
    } catch (error) {
      return rejectWithValue({
        code: "LOAD_PERSONAL_EXPENSES_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Failed to load personal expenses",
      });
    }
  },
);

import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../store/appState";
import type { PersonalExpense } from "../domain/manage-personal-expenses/personal-expense";
import type { UserGateway } from "../ports/UserGateway";

export const loadPersonalExpenses = createAsyncThunk<
  PersonalExpense[],
  void,
  { extra: { userGateway: UserGateway }; state: AppState }
>(
  "user/loadPersonalExpenses",
  async (_, { rejectWithValue, extra, getState }) => {
    try {
      // Get current user ID
      const state = getState();
      const userId = state.auth?.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Load expenses via gateway
      return await extra.userGateway.loadPersonalExpenses(userId);
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to load personal expenses");
    }
  },
);

import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../store/appState";
import type { UserGateway } from "../ports/UserGateway";

export const deletePersonalExpense = createAsyncThunk<
  string, // Return the expenseId that was deleted
  string,
  { extra: { userGateway: UserGateway }; state: AppState }
>(
  "user/deletePersonalExpense",
  async (expenseId, { rejectWithValue, extra, getState }) => {
    try {
      // Get current user ID
      const state = getState();
      const userId = state.auth?.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Delete expense via gateway
      await extra.userGateway.deletePersonalExpense(userId, expenseId);

      // Return the expenseId so the reducer can remove it from state
      return expenseId;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to delete personal expense");
    }
  },
);

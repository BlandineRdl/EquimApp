import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../store/appState";
import type { PersonalExpense } from "../domain/manage-personal-expenses/personal-expense";
import { validateExpense } from "../domain/manage-personal-expenses/validate-expense";
import type { NewPersonalExpense, UserGateway } from "../ports/UserGateway";

export const addPersonalExpense = createAsyncThunk<
  PersonalExpense, // Return the created expense
  NewPersonalExpense,
  { extra: { userGateway: UserGateway }; state: AppState }
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
        throw new Error("User not authenticated");
      }

      // Add expense via gateway
      const createdExpense = await extra.userGateway.addPersonalExpense(
        userId,
        expense,
      );

      // Return the created expense so the reducer can add it to state
      return createdExpense;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to add personal expense");
    }
  },
);

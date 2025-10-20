import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../store/appState";
import { validateExpense } from "../domain/expenseValidation.service";
import type {
  CreatePersonalExpenseDTO,
  PersonalExpense,
} from "../domain/personalExpense.model";
import { userGateway } from "../infra/gateway";
import type { UserGateway } from "../ports/UserGateway";

export const addPersonalExpense = createAsyncThunk<
  PersonalExpense, // Return the created expense
  CreatePersonalExpenseDTO,
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
      const gateway = extra?.userGateway || userGateway;
      const createdExpense = await gateway.addPersonalExpense(userId, expense);

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

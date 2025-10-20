import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../store/appState";
import { validateExpense } from "../domain/expenseValidation.service";
import type {
  PersonalExpense,
  UpdatePersonalExpenseDTO,
} from "../domain/personalExpense.model";
import { userGateway } from "../infra/gateway";
import type { UserGateway } from "../ports/UserGateway";

export const updatePersonalExpense = createAsyncThunk<
  PersonalExpense, // Return the updated expense
  UpdatePersonalExpenseDTO,
  { extra: { userGateway: UserGateway }; state: AppState }
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
        throw new Error("User not authenticated");
      }

      // Update expense via gateway
      const gateway = extra?.userGateway || userGateway;
      const updatedExpense = await gateway.updatePersonalExpense(
        userId,
        expense,
      );

      // Return the updated expense so the reducer can update it in state
      return updatedExpense;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to update personal expense");
    }
  },
);

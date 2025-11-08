import { createAsyncThunk } from "@reduxjs/toolkit";
import { logger } from "../../../lib/logger";
import type { AppThunkApiConfig } from "../../../types/thunk.types";
import { validateIncome } from "../domain/manage-profile/validate-income";

export interface UpdateUserIncomeInput {
  userId: string;
  newIncome: number;
}

export const updateUserIncome = createAsyncThunk<
  { income: number },
  UpdateUserIncomeInput,
  AppThunkApiConfig
>(
  "user/updateIncome",
  async (
    { userId, newIncome },
    { extra: { userGateway }, rejectWithValue },
  ) => {
    logger.debug("updateUserIncome usecase started", { userId, newIncome });

    const validation = validateIncome(newIncome);
    if (!validation.isValid) {
      logger.error("Income validation failed", { errors: validation.errors });
      return rejectWithValue({
        code: "INVALID_INCOME",
        message: validation.errors.join(", "),
        details: { income: newIncome, errors: validation.errors },
      });
    }

    try {
      await userGateway.updateProfile(userId, { monthlyIncome: newIncome });

      logger.info("Income updated successfully", { userId, newIncome });
      return { income: newIncome };
    } catch (error) {
      return rejectWithValue({
        code: "UPDATE_USER_INCOME_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la mise à jour du revenu",
        details: { userId, income: newIncome },
      });
    }
  },
);

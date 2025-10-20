import { createAsyncThunk } from "@reduxjs/toolkit";
import { logger } from "../../../lib/logger";
import type { AppState } from "../../../store/appState";
import { validateIncome } from "../domain/incomeValidation.service";
import type { UserGateway } from "../ports/UserGateway";

export interface UpdateUserIncomeInput {
  userId: string;
  newIncome: number;
}

/**
 * Update user's monthly income
 * Validates income before updating
 * Triggers recalculation of group shares via Supabase listeners
 */
export const updateUserIncome = createAsyncThunk<
  { income: number },
  UpdateUserIncomeInput,
  { state: AppState; extra: { userGateway: UserGateway } }
>(
  "user/updateIncome",
  async ({ userId, newIncome }, { extra: { userGateway } }) => {
    logger.debug("updateUserIncome usecase started", { userId, newIncome });

    // Validate income
    const validation = validateIncome(newIncome);
    if (!validation.isValid) {
      logger.error("Income validation failed", { errors: validation.errors });
      throw new Error(validation.errors.join(", "));
    }

    // Update profile in database
    await userGateway.updateProfile(userId, { income: newIncome });

    logger.info("Income updated successfully", { userId, newIncome });
    return { income: newIncome };
  },
);

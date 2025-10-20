import { createAsyncThunk } from "@reduxjs/toolkit";
import { logger } from "../../../lib/logger";
import type { AppState } from "../../../store/appState";
import type { PersonalExpense } from "../domain/personalExpense.model";
import type { UserGateway } from "../ports/UserGateway";

/**
 * Load current user's profile
 * Returns null if profile doesn't exist (user needs onboarding)
 */
export const loadUserProfile = createAsyncThunk<
  {
    id: string;
    pseudo: string;
    monthlyIncome: number;
    personalExpenses: PersonalExpense[];
    capacity?: number;
  } | null,
  void,
  { state: AppState; extra: { userGateway: UserGateway } }
>("user/loadProfile", async (_, { getState, extra: { userGateway } }) => {
  logger.debug("loadUserProfile usecase started");
  const userId = getState().auth.userId;
  logger.debug("Current userId from state", { userId });

  if (!userId) {
    logger.error("No userId in state");
    throw new Error("User not authenticated");
  }

  const profile = await userGateway.getProfileById(userId);
  logger.debug("[loadUserProfile] Profile fetched", { profile });

  if (!profile) {
    logger.info("No profile found - user needs onboarding");
    return null; // User needs onboarding
  }

  logger.debug("[loadUserProfile] Loading personal expenses...");
  // Load personal expenses
  const personalExpenses = await userGateway.loadPersonalExpenses(userId);
  logger.debug("[loadUserProfile] Personal expenses loaded", {
    count: personalExpenses.length,
  });

  logger.info("Profile loaded in usecase");

  // Create plain objects to ensure Redux serializability
  const result = {
    id: profile.id,
    pseudo: profile.pseudo,
    monthlyIncome: profile.income,
    personalExpenses: personalExpenses.map((expense) => ({
      id: expense.id,
      userId: expense.userId,
      label: expense.label,
      amount: expense.amount,
    })),
    capacity: profile.capacity,
  };

  logger.debug("[loadUserProfile] Returning result", result);
  return result;
});

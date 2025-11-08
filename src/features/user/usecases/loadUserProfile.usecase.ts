import { createAsyncThunk } from "@reduxjs/toolkit";
import { logger } from "../../../lib/logger";
import type { AppState } from "../../../store/appState";
import type { User } from "../domain/manage-profile/profile";
import type { UserGateway } from "../ports/UserGateway";

export const loadUserProfile = createAsyncThunk<
  User | null,
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
    return null;
  }

  logger.debug("[loadUserProfile] Loading personal expenses...");
  const personalExpenses = await userGateway.loadPersonalExpenses(userId);
  logger.debug("[loadUserProfile] Personal expenses loaded", {
    count: personalExpenses.length,
  });

  logger.info("Profile loaded in usecase");

  return {
    ...profile,
    personalExpenses,
  };
});

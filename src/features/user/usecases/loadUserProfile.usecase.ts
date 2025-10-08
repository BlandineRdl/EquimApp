import { createAsyncThunk } from "@reduxjs/toolkit";
import { logger } from "../../../lib/logger";
import type { AppState } from "../../../store/appState";
import type { UserGateway } from "../ports/UserGateway";

/**
 * Load current user's profile
 * Returns null if profile doesn't exist (user needs onboarding)
 */
export const loadUserProfile = createAsyncThunk<
	{ id: string; pseudo: string; income: number } | null,
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

	if (!profile) {
		logger.info("No profile found - user needs onboarding");
		return null; // User needs onboarding
	}

	logger.info("Profile loaded in usecase", { pseudo: profile.pseudo });
	return {
		id: profile.id,
		pseudo: profile.pseudo,
		income: profile.income,
	};
});

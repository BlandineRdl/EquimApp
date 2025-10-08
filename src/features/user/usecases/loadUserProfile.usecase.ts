import { createAsyncThunk } from "@reduxjs/toolkit";
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
	console.log("📋 loadUserProfile usecase started");
	const userId = getState().auth.userId;
	console.log("📋 Current userId from state:", userId);

	if (!userId) {
		console.error("❌ No userId in state!");
		throw new Error("User not authenticated");
	}

	const profile = await userGateway.getProfileById(userId);

	if (!profile) {
		console.log("ℹ️ No profile found - user needs onboarding");
		return null; // User needs onboarding
	}

	console.log("✅ Profile loaded in usecase:", profile.pseudo);
	return {
		id: profile.id,
		pseudo: profile.pseudo,
		income: profile.income,
	};
});

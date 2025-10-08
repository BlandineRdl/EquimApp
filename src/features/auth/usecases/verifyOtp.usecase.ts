import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../store/appState";
import type { AuthGateway } from "../ports/AuthGateway";

export const verifyOtp = createAsyncThunk<
	void,
	{ email: string; token: string },
	{
		state: AppState;
		extra: { authGateway: AuthGateway };
	}
>("auth/verifyOtp", async ({ email, token }, { extra: { authGateway } }) => {
	await authGateway.verifyOtp(email, token);
});

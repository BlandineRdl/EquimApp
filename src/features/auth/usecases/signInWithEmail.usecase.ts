import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AuthGateway } from "../ports/AuthGateway";

// Email validation helper
const validateEmail = (email: string): string => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		throw new Error("Please enter a valid email address");
	}
	return email.trim().toLowerCase();
};

export const signInWithEmail = createAsyncThunk<
	void,
	string,
	{ extra: { authGateway: AuthGateway } }
>("auth/signIn", async (email, { extra: { authGateway } }) => {
	// Validate and normalize email
	const normalizedEmail = validateEmail(email);

	// Send magic link
	await authGateway.signInWithEmail(normalizedEmail);
});

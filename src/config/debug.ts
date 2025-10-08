/**
 * Debug configuration
 * Set these flags to true to bypass certain flows during development
 */

export const DEBUG_CONFIG = {
	// Auto-login with this email at startup (uses real OTP auth)
	// Set to null to disable auto-login
	AUTO_LOGIN_EMAIL: "your-email@example.com",

	// OTP code to use for auto-login (get it from your email)
	// You'll need to trigger a sign-in first to receive the code
	AUTO_LOGIN_OTP: null as string | null,
};

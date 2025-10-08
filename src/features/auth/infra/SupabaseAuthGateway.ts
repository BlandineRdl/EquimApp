import type { Session } from "@supabase/supabase-js";

import { logger } from "../../../lib/logger";
import { supabase } from "../../../lib/supabase/client";
import { createUserFriendlyError } from "../../../lib/supabase/errors";

import type { AuthGateway } from "../ports/AuthGateway";

export class SupabaseAuthGateway implements AuthGateway {
	async signInWithEmail(email: string): Promise<void> {
		try {
			const { error } = await supabase.auth.signInWithOtp({
				email,
				options: {
					// Don't send magic link, just send OTP code
					shouldCreateUser: true,
				},
			});

			if (error) {
				throw createUserFriendlyError(error);
			}
		} catch (error) {
			throw createUserFriendlyError(error);
		}
	}

	async verifyOtp(email: string, token: string): Promise<Session> {
		try {
			const { data, error } = await supabase.auth.verifyOtp({
				email,
				token,
				type: "email",
			});

			if (error) {
				throw createUserFriendlyError(error);
			}

			if (!data.session) {
				throw new Error("Aucune session créée");
			}

			return data.session;
		} catch (error) {
			throw createUserFriendlyError(error);
		}
	}

	async signOut(): Promise<void> {
		try {
			const { error } = await supabase.auth.signOut();

			if (error) {
				throw createUserFriendlyError(error);
			}
		} catch (error) {
			throw createUserFriendlyError(error);
		}
	}

	async getSession(): Promise<Session | null> {
		try {
			const { data, error } = await supabase.auth.getSession();

			if (error) {
				throw createUserFriendlyError(error);
			}

			return data.session;
		} catch (error) {
			logger.error("Error getting session", error);
			return null;
		}
	}

	onAuthStateChange(
		callback: (session: Session | null) => void,
	): { unsubscribe: () => void } {
		const { data: subscription } = supabase.auth.onAuthStateChange(
			(_event, session) => {
				callback(session);
			},
		);

		return {
			unsubscribe: () => {
				subscription.subscription.unsubscribe();
			},
		};
	}

	async deleteAccount(): Promise<void> {
		try {
			// Get current user ID
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();

			if (userError || !user) {
				throw createUserFriendlyError(
					userError || new Error("User not found"),
				);
			}

			// Soft delete: set deleted_at and remove pseudo
			const { error: updateError } = await supabase
				.from("profiles")
				.update({
					deleted_at: new Date().toISOString(),
					pseudo: null,
				})
				.eq("id", user.id);

			if (updateError) {
				throw createUserFriendlyError(updateError);
			}

			// Sign out after soft delete
			await this.signOut();
		} catch (error) {
			throw createUserFriendlyError(error);
		}
	}
}

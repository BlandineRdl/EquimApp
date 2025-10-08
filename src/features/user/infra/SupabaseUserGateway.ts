import { supabase } from "../../../lib/supabase/client";
import { createUserFriendlyError } from "../../../lib/supabase/errors";
import type {
	CreateProfileInput,
	ProfileData,
	UpdateProfileInput,
	UserGateway,
} from "../ports/UserGateway";

export class SupabaseUserGateway implements UserGateway {
	async createProfile(input: CreateProfileInput): Promise<void> {
		try {
			const { error } = await supabase.from("profiles").insert({
				id: input.id,
				pseudo: input.pseudo,
				income_or_weight: input.income,
				currency_code: input.currency,
				share_revenue: input.shareRevenue,
			});

			if (error) {
				throw createUserFriendlyError(error);
			}
		} catch (error) {
			throw createUserFriendlyError(error);
		}
	}

	async getProfileById(id: string): Promise<ProfileData | null> {
		try {
			console.log("🔍 Loading profile for user ID:", id);

			const { data, error } = await supabase
				.from("profiles")
				.select("*")
				.eq("id", id)
				.is("deleted_at", null)
				.single();

			if (error) {
				console.log("❌ Error loading profile:", error);
				// Not found is not an error, return null
				if (error.code === "PGRST116") {
					console.log("ℹ️ Profile not found (PGRST116)");
					return null;
				}
				throw createUserFriendlyError(error);
			}

			if (!data) {
				console.log("ℹ️ No profile data returned");
				return null;
			}

			console.log("✅ Profile loaded successfully:", data.pseudo);

			// Map database fields to domain model
			return {
				id: data.id,
				pseudo: data.pseudo || "",
				income: Number(data.income_or_weight || data.weight_override || 0),
				shareRevenue: data.share_revenue,
				currency: data.currency_code,
				createdAt: data.created_at,
			};
		} catch (error) {
			console.error("💥 Error getting profile:", error);
			return null;
		}
	}

	async updateProfile(id: string, patch: UpdateProfileInput): Promise<void> {
		try {
			// Build update object based on provided fields
			const updates: Record<string, unknown> = {};

			if (patch.pseudo !== undefined) {
				updates.pseudo = patch.pseudo;
			}
			if (patch.income !== undefined) {
				updates.income_or_weight = patch.income;
			}
			if (patch.shareRevenue !== undefined) {
				updates.share_revenue = patch.shareRevenue;
			}

			const { error } = await supabase
				.from("profiles")
				.update(updates)
				.eq("id", id)
				.is("deleted_at", null);

			if (error) {
				throw createUserFriendlyError(error);
			}
		} catch (error) {
			throw createUserFriendlyError(error);
		}
	}
}

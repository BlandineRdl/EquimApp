import { logger } from "../../../lib/logger";
import { supabase } from "../../../lib/supabase/client";
import { createUserFriendlyError } from "../../../lib/supabase/errors";
import type { PersonalExpense } from "../domain/manage-personal-expenses/personal-expense";
import type { User } from "../domain/manage-profile/profile";
import type {
  CreateProfileInput,
  NewPersonalExpense,
  PersonalExpenseUpdate,
  UpdateProfileInput,
  UserGateway,
} from "../ports/UserGateway";

export class SupabaseUserGateway implements UserGateway {
  async createProfile(input: CreateProfileInput): Promise<void> {
    try {
      const { error } = await supabase.from("profiles").insert({
        id: input.id,
        pseudo: input.pseudo,
        income_or_weight: input.monthlyIncome,
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

  async getProfileById(id: string): Promise<User | null> {
    try {
      logger.debug("Loading profile for user", { userId: id });

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          logger.info("Profile not found - user needs onboarding");
          return null;
        }
        logger.error("Error loading profile", { error });
        throw createUserFriendlyError(error);
      }

      if (!data) {
        logger.info("No profile data returned");
        return null;
      }

      logger.info("Profile loaded successfully");

      return {
        id: data.id,
        pseudo: data.pseudo || "",
        monthlyIncome: Number(
          data.income_or_weight || data.weight_override || 0,
        ),
        shareRevenue: data.share_revenue,
        currency: data.currency_code,
        personalExpenses: undefined,
        capacity: data.monthly_capacity
          ? Number(data.monthly_capacity)
          : undefined,
      };
    } catch (error) {
      logger.error("Error getting profile", error);
      return null;
    }
  }

  async updateProfile(id: string, patch: UpdateProfileInput): Promise<void> {
    try {
      const updates: Record<string, unknown> = {};

      if (patch.pseudo !== undefined) {
        updates.pseudo = patch.pseudo;
      }
      if (patch.monthlyIncome !== undefined) {
        updates.income_or_weight = patch.monthlyIncome;
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

  async addPersonalExpense(
    userId: string,
    expense: NewPersonalExpense,
  ): Promise<PersonalExpense> {
    try {
      const { data, error } = await supabase
        .from("user_personal_expenses")
        .insert({
          user_id: userId,
          label: expense.label,
          amount: expense.amount,
        })
        .select()
        .single();

      if (error) {
        throw createUserFriendlyError(error);
      }

      if (!data) {
        throw new Error("Failed to create personal expense");
      }

      return {
        id: data.id,
        userId: data.user_id,
        label: data.label,
        amount: Number(data.amount),
      };
    } catch (error) {
      throw createUserFriendlyError(error);
    }
  }

  async updatePersonalExpense(
    userId: string,
    expense: PersonalExpenseUpdate,
  ): Promise<PersonalExpense> {
    try {
      const { data, error } = await supabase
        .from("user_personal_expenses")
        .update({
          label: expense.label,
          amount: expense.amount,
        })
        .eq("id", expense.id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        throw createUserFriendlyError(error);
      }

      if (!data) {
        throw new Error("Failed to update personal expense");
      }

      return {
        id: data.id,
        userId: data.user_id,
        label: data.label,
        amount: Number(data.amount),
      };
    } catch (error) {
      throw createUserFriendlyError(error);
    }
  }

  async deletePersonalExpense(
    userId: string,
    expenseId: string,
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("user_personal_expenses")
        .delete()
        .eq("id", expenseId)
        .eq("user_id", userId);

      if (error) {
        throw createUserFriendlyError(error);
      }
    } catch (error) {
      throw createUserFriendlyError(error);
    }
  }

  async loadPersonalExpenses(userId: string): Promise<PersonalExpense[]> {
    try {
      logger.debug("[SupabaseUserGateway] Loading personal expenses", {
        userId,
      });
      const { data, error } = await supabase
        .from("user_personal_expenses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) {
        logger.error(
          "[SupabaseUserGateway] Supabase error loading personal expenses",
          error,
          {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          },
        );
        throw createUserFriendlyError(error);
      }

      if (!data) {
        logger.debug(
          "[SupabaseUserGateway] No data returned, returning empty array",
        );
        return [];
      }

      logger.debug("[SupabaseUserGateway] Personal expenses loaded", {
        count: data.length,
      });
      return data.map((expense) => ({
        id: expense.id,
        userId: expense.user_id,
        label: expense.label,
        amount: Number(expense.amount),
      }));
    } catch (error) {
      logger.error(
        "[SupabaseUserGateway] Exception in loadPersonalExpenses",
        error,
      );
      throw createUserFriendlyError(error);
    }
  }

  async getUserCapacity(userId: string): Promise<number | undefined> {
    try {
      logger.debug("[SupabaseUserGateway] Loading user capacity", { userId });
      const { data, error } = await supabase
        .from("profiles")
        .select("monthly_capacity")
        .eq("id", userId)
        .single();

      if (error) {
        logger.error("[SupabaseUserGateway] Error loading capacity", error);
        throw createUserFriendlyError(error);
      }

      const capacityValue = data?.monthly_capacity;
      const capacity =
        capacityValue !== null && capacityValue !== undefined
          ? Number(capacityValue)
          : undefined;

      logger.debug("[SupabaseUserGateway] Capacity loaded", { capacity });
      return capacity;
    } catch (error) {
      logger.error("[SupabaseUserGateway] Exception in getUserCapacity", error);

      return undefined;
    }
  }
}

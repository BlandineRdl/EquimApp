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

  onAuthStateChange(callback: (session: Session | null) => void): {
    unsubscribe: () => void;
  } {
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
        throw createUserFriendlyError(userError || new Error("User not found"));
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

  async resetAccount(): Promise<void> {
    try {
      // Get current user ID
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw createUserFriendlyError(userError || new Error("User not found"));
      }

      logger.warn("[RESET] Permanently deleting user and all data", {
        userId: user.id,
      });

      // 1. Delete all groups where user is creator
      // (This will cascade delete group_members, expenses, invitations via DB constraints)
      const { error: groupsError } = await supabase
        .from("groups")
        .delete()
        .eq("creator_id", user.id);

      if (groupsError) {
        logger.error("[RESET] Failed to delete groups", groupsError);
        throw createUserFriendlyError(groupsError);
      }

      // 2. Remove user from all groups they're a member of (but not creator)
      const { error: membershipsError } = await supabase
        .from("group_members")
        .delete()
        .eq("user_id", user.id);

      if (membershipsError) {
        logger.error(
          "[RESET] Failed to delete group memberships",
          membershipsError,
        );
        throw createUserFriendlyError(membershipsError);
      }

      // 3. Delete user's personal expenses
      // (This will cascade via ON DELETE CASCADE constraint)
      const { error: expensesError } = await supabase
        .from("user_personal_expenses")
        .delete()
        .eq("user_id", user.id);

      if (expensesError) {
        logger.error(
          "[RESET] Failed to delete personal expenses",
          expensesError,
        );
        throw createUserFriendlyError(expensesError);
      }

      // 4. Delete invitations created by user
      const { error: invitationsError } = await supabase
        .from("invitations")
        .delete()
        .eq("created_by", user.id);

      if (invitationsError) {
        logger.error("[RESET] Failed to delete invitations", invitationsError);
        throw createUserFriendlyError(invitationsError);
      }

      // 5. Finally, hard delete the profile
      // (This will cascade delete auth.users via ON DELETE CASCADE)
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (profileError) {
        logger.error("[RESET] Failed to delete profile", profileError);
        throw createUserFriendlyError(profileError);
      }

      // Sign out
      await this.signOut();

      logger.info("[RESET] Account reset complete - all data deleted");
    } catch (error) {
      logger.error("[RESET] Reset account failed", error);
      throw createUserFriendlyError(error);
    }
  }
}

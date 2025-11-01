import { createAsyncThunk } from "@reduxjs/toolkit";
import { logger } from "../../../../lib/logger";
import type { AppThunkApiConfig } from "../../../../types/thunk.types";
import { MIN_PSEUDO_LENGTH } from "../../domain/manage-members/member.constants";

export interface AcceptInvitationInput {
  token: string;
  pseudo: string;
  monthlyIncome: number;
}

export const acceptInvitation = createAsyncThunk<
  { groupId: string },
  AcceptInvitationInput,
  AppThunkApiConfig
>(
  "groups/acceptInvitation",
  async (
    { token, pseudo, monthlyIncome },
    { extra: { groupGateway, authGateway, userGateway }, rejectWithValue },
  ) => {
    logger.debug("[acceptInvitation] Starting", {
      token,
      pseudo,
      income: monthlyIncome,
    });

    // Validate token
    if (!token || !token.trim()) {
      logger.error("[acceptInvitation] Invalid token");
      return rejectWithValue({
        code: "INVALID_INVITATION_TOKEN",
        message: "Token d'invitation invalide",
        details: { token },
      });
    }

    // Validate member data
    if (!pseudo.trim()) {
      logger.error("[acceptInvitation] Invalid pseudo");
      return rejectWithValue({
        code: "EMPTY_PSEUDO",
        message: "Le pseudo ne peut pas être vide",
        details: { pseudo },
      });
    }

    if (pseudo.trim().length < MIN_PSEUDO_LENGTH) {
      return rejectWithValue({
        code: "PSEUDO_TOO_SHORT",
        message: `Le pseudo doit contenir au moins ${MIN_PSEUDO_LENGTH} caractères`,
        details: { length: pseudo.trim().length, minLength: MIN_PSEUDO_LENGTH },
      });
    }

    if (monthlyIncome <= 0) {
      return rejectWithValue({
        code: "INVALID_MONTHLY_INCOME",
        message: "Le revenu mensuel doit être positif",
        details: { monthlyIncome },
      });
    }

    try {
      // Get current user session
      const session = await authGateway.getSession();
      if (!session?.user) {
        return rejectWithValue({
          code: "USER_NOT_AUTHENTICATED",
          message: "Utilisateur non authentifié",
        });
      }

      const userId = session.user.id;

      // Update or create user profile first
      // Check if profile exists
      const existingProfile = await userGateway.getProfileById(userId);

      if (existingProfile) {
        // Update existing profile
        await userGateway.updateProfile(userId, {
          pseudo: pseudo.trim(),
          monthlyIncome,
          shareRevenue: true,
        });
        logger.debug("[acceptInvitation] Updated existing profile", { userId });
      } else {
        // Create new profile
        // Note: We need to provide currency, defaulting to EUR
        await userGateway.createProfile({
          id: userId,
          pseudo: pseudo.trim(),
          monthlyIncome,
          shareRevenue: true,
          currency: "EUR",
        });
        logger.debug("[acceptInvitation] Created new profile", { userId });
      }

      // Now accept invitation
      logger.debug("[acceptInvitation] Calling gateway.acceptInvitation", {
        token,
      });
      const result = await groupGateway.acceptInvitation(token);
      logger.info("[acceptInvitation] Success", { groupId: result.groupId });
      return { groupId: result.groupId };
    } catch (error) {
      return rejectWithValue({
        code: "ACCEPT_INVITATION_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'acceptation de l'invitation",
        details: { token, pseudo: pseudo.trim() },
      });
    }
  },
);

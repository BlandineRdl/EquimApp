import { createAsyncThunk } from "@reduxjs/toolkit";
import { logger } from "../../../../lib/logger";
import type { AppState } from "../../../../store/appState";
import type { AuthGateway } from "../../../auth/ports/AuthGateway";
import type { UserGateway } from "../../../user/ports/UserGateway";
import { MIN_PSEUDO_LENGTH } from "../../domain/manage-members/member.constants";
import type { GroupGateway } from "../../ports/GroupGateway";

export interface AcceptInvitationInput {
  token: string;
  pseudo: string;
  monthlyIncome: number;
}

export const acceptInvitation = createAsyncThunk<
  { groupId: string },
  AcceptInvitationInput,
  {
    state: AppState;
    extra: {
      groupGateway: GroupGateway;
      authGateway: AuthGateway;
      userGateway: UserGateway;
    };
  }
>(
  "groups/acceptInvitation",
  async (
    { token, pseudo, monthlyIncome },
    { extra: { groupGateway, authGateway, userGateway } },
  ) => {
    logger.debug("[acceptInvitation] Starting", {
      token,
      pseudo,
      income: monthlyIncome,
    });

    // Validate token
    if (!token || !token.trim()) {
      logger.error("[acceptInvitation] Invalid token");
      throw new Error("Token d'invitation invalide");
    }

    // Validate member data
    if (!pseudo.trim()) {
      logger.error("[acceptInvitation] Invalid pseudo");
      throw new Error("Le pseudo ne peut pas être vide");
    }

    if (pseudo.trim().length < MIN_PSEUDO_LENGTH) {
      throw new Error(
        `Le pseudo doit contenir au moins ${MIN_PSEUDO_LENGTH} caractères`,
      );
    }

    if (monthlyIncome <= 0) {
      throw new Error("Le revenu mensuel doit être positif");
    }

    // Get current user session
    const session = await authGateway.getSession();
    if (!session?.user) {
      throw new Error("Utilisateur non authentifié");
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
  },
);

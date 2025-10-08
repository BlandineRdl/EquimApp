import { createAsyncThunk } from "@reduxjs/toolkit";
import { logger } from "../../../../lib/logger";
import { supabase } from "../../../../lib/supabase/client";
import type { AppState } from "../../../../store/appState";
import { MIN_PSEUDO_LENGTH } from "../../domain/group.constants";
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
    extra: { groupGateway: GroupGateway };
  }
>(
  "groups/acceptInvitation",
  async ({ token, pseudo, monthlyIncome }, { extra: { groupGateway } }) => {
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

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Utilisateur non authentifié");
    }

    // Update or create user profile first
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      pseudo: pseudo.trim(),
      income_or_weight: monthlyIncome,
      share_revenue: true,
    });

    if (profileError) {
      throw new Error("Erreur lors de la création du profil");
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

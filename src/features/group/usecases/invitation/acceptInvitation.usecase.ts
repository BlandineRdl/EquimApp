import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import {
  INVITATION_TOKEN_PREFIX,
  MIN_PSEUDO_LENGTH,
} from "../../domain/group.constants";
import type { Group } from "../../domain/group.model";
import type { AddMemberData, GroupGateway } from "../../ports/group.gateway";

export const acceptInvitation = createAsyncThunk<
  Group,
  { token: string; memberData: AddMemberData },
  {
    state: AppState;
    extra: { groupGateway: GroupGateway };
  }
>(
  "groups/acceptInvitation",
  async ({ token, memberData }, { extra: { groupGateway } }) => {
    if (!token || !token.startsWith(INVITATION_TOKEN_PREFIX)) {
      throw new Error("Token d'invitation invalide");
    }

    // Validation des données du membre
    if (!memberData.pseudo.trim()) {
      throw new Error("Le pseudo ne peut pas être vide");
    }

    if (memberData.pseudo.trim().length < MIN_PSEUDO_LENGTH) {
      throw new Error(
        `Le pseudo doit contenir au moins ${MIN_PSEUDO_LENGTH} caractères`,
      );
    }

    if (memberData.monthlyIncome <= 0) {
      throw new Error("Le revenu mensuel doit être positif");
    }

    const updatedGroup = await groupGateway.acceptInvitation(token, memberData);
    return updatedGroup;
  },
);

import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import type { Group } from "../../domain/group.model";
import type { AddMemberData, GroupGateway } from "../../ports/group.gateway";

export const addMemberToGroup = createAsyncThunk<
  Group,
  { groupId: string; memberData: AddMemberData },
  {
    state: AppState;
    extra: { groupGateway: GroupGateway };
  }
>(
  "groups/addMemberToGroup",
  async ({ groupId, memberData }, { getState, extra: { groupGateway } }) => {
    // Validation des données du membre
    if (!memberData.pseudo.trim()) {
      throw new Error("Le pseudo ne peut pas être vide");
    }

    if (memberData.pseudo.trim().length < 2) {
      throw new Error("Le pseudo doit contenir au moins 2 caractères");
    }

    if (memberData.monthlyIncome <= 0) {
      throw new Error("Le revenu mensuel doit être positif");
    }

    // Vérifier que le groupe existe (logique métier)
    const state = getState();
    const groupExists = state.groups.entities[groupId];
    if (!groupExists) {
      throw new Error("Groupe non trouvé");
    }

    // Le gateway fait juste l'opération technique
    const updatedGroup = await groupGateway.addMemberToGroup(
      groupId,
      memberData,
    );
    return updatedGroup;
  },
);

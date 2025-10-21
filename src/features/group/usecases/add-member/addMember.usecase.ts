import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import type {
  GroupGateway,
  GroupMember,
  Shares,
} from "../../ports/GroupGateway";

export interface AddMemberData {
  pseudo: string; // Required custom name (backend will prepend "Membre-")
  monthlyIncome?: number; // Optional, defaults to 0
}

export const addMemberToGroup = createAsyncThunk<
  {
    groupId: string;
    newMember: GroupMember;
    shares: Shares;
  },
  { groupId: string; memberData: AddMemberData },
  {
    state: AppState;
    extra: { groupGateway: GroupGateway };
  }
>(
  "groups/addMemberToGroup",
  async ({ groupId, memberData }, { getState, extra: { groupGateway } }) => {
    // Vérifier que le groupe existe (logique métier)
    const state = getState();
    const groupExists = state.groups.entities[groupId];
    if (!groupExists) {
      throw new Error("Groupe non trouvé");
    }

    // Validate income
    const income = memberData.monthlyIncome ?? 0;
    if (income < 0) {
      throw new Error("Le revenu ne peut pas être négatif");
    }

    // Validate pseudo (required)
    const trimmedPseudo = memberData.pseudo.trim();
    if (trimmedPseudo.length < 1 || trimmedPseudo.length > 50) {
      throw new Error("Le nom doit faire entre 1 et 50 caractères");
    }
    if (!/^[a-zA-Z0-9\s-]+$/.test(trimmedPseudo)) {
      throw new Error(
        "Le nom ne peut contenir que des lettres, chiffres, tirets et espaces",
      );
    }

    // Add phantom member via gateway with custom pseudo
    const result = await groupGateway.addPhantomMember(
      groupId,
      trimmedPseudo,
      income,
    );

    // Create the new member object with the generated pseudo
    const newMember: GroupMember = {
      id: result.memberId,
      userId: null,
      pseudo: result.pseudo, // Membre-{suffix}
      shareRevenue: true,
      incomeOrWeight: income,
      monthlyCapacity: income, // Phantom members have no personal expenses
      joinedAt: new Date().toISOString(),
      isPhantom: true,
    };

    return {
      groupId,
      newMember,
      shares: result.shares,
    };
  },
);

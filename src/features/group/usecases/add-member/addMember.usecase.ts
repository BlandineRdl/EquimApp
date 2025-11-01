import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../../types/thunk.types";
import type { GroupMember, Shares } from "../../ports/GroupGateway";

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
  AppThunkApiConfig
>(
  "groups/addMemberToGroup",
  async (
    { groupId, memberData },
    { getState, extra: { groupGateway }, rejectWithValue },
  ) => {
    // Vérifier que le groupe existe (logique métier)
    const state = getState();
    const groupExists = state.groups.entities[groupId];
    if (!groupExists) {
      return rejectWithValue({
        code: "GROUP_NOT_FOUND",
        message: "Groupe non trouvé",
        details: { groupId },
      });
    }

    // Validate income
    const income = memberData.monthlyIncome ?? 0;
    if (income < 0) {
      return rejectWithValue({
        code: "NEGATIVE_INCOME",
        message: "Le revenu ne peut pas être négatif",
        details: { income },
      });
    }

    // Validate pseudo (required)
    const trimmedPseudo = memberData.pseudo.trim();
    if (trimmedPseudo.length < 1 || trimmedPseudo.length > 50) {
      return rejectWithValue({
        code: "INVALID_PSEUDO_LENGTH",
        message: "Le nom doit faire entre 1 et 50 caractères",
        details: { length: trimmedPseudo.length, min: 1, max: 50 },
      });
    }
    if (!/^[a-zA-Z0-9\s-]+$/.test(trimmedPseudo)) {
      return rejectWithValue({
        code: "INVALID_PSEUDO_FORMAT",
        message:
          "Le nom ne peut contenir que des lettres, chiffres, tirets et espaces",
        details: { pseudo: trimmedPseudo },
      });
    }

    try {
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
    } catch (error) {
      return rejectWithValue({
        code: "ADD_MEMBER_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'ajout du membre",
        details: { groupId, pseudo: trimmedPseudo },
      });
    }
  },
);

import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../../types/thunk.types";
import type { Shares } from "../../ports/GroupGateway";

export interface UpdatePhantomMemberData {
  memberId: string;
  groupId: string;
  newPseudo: string;
  newIncome?: number;
}

export const updatePhantomMember = createAsyncThunk<
  {
    memberId: string;
    groupId: string;
    pseudo: string;
    income: number;
    shares: Shares;
  },
  UpdatePhantomMemberData,
  AppThunkApiConfig
>(
  "groups/updatePhantomMember",
  async (
    { memberId, groupId, newPseudo, newIncome },
    { extra: { groupGateway }, rejectWithValue },
  ) => {
    if (!newPseudo.startsWith("Membre-")) {
      return rejectWithValue({
        code: "INVALID_PSEUDO_FORMAT",
        message: 'Le pseudo doit commencer par "Membre-"',
        details: { pseudo: newPseudo },
      });
    }

    const suffix = newPseudo.substring(7);
    if (suffix.length < 1 || suffix.length > 50) {
      return rejectWithValue({
        code: "INVALID_PSEUDO_LENGTH",
        message: "Le pseudo doit faire entre 8 et 57 caractères",
        details: { length: newPseudo.length, min: 8, max: 57 },
      });
    }

    if (!/^[a-zA-Z0-9\s-]+$/.test(suffix)) {
      return rejectWithValue({
        code: "INVALID_PSEUDO_CHARACTERS",
        message:
          "Le pseudo ne peut contenir que des lettres, chiffres, tirets et espaces",
        details: { pseudo: newPseudo },
      });
    }

    if (newIncome !== undefined && newIncome < 0) {
      return rejectWithValue({
        code: "NEGATIVE_INCOME",
        message: "Le revenu ne peut pas être négatif",
        details: { income: newIncome },
      });
    }

    try {
      const result = await groupGateway.updatePhantomMember(
        memberId,
        newPseudo,
        newIncome,
      );

      return {
        memberId: result.memberId,
        groupId,
        pseudo: result.pseudo,
        income: newIncome ?? 0,
        shares: result.shares,
      };
    } catch (error) {
      return rejectWithValue({
        code: "UPDATE_PHANTOM_MEMBER_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la mise à jour du membre",
        details: { memberId, groupId, pseudo: newPseudo },
      });
    }
  },
);

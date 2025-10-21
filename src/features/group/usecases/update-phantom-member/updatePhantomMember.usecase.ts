import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import type { GroupGateway, Shares } from "../../ports/GroupGateway";

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
  {
    state: AppState;
    extra: { groupGateway: GroupGateway };
  }
>(
  "groups/updatePhantomMember",
  async (
    { memberId, groupId, newPseudo, newIncome },
    { extra: { groupGateway } },
  ) => {
    // Validate format: must start with "Membre-"
    if (!newPseudo.startsWith("Membre-")) {
      throw new Error('Le pseudo doit commencer par "Membre-"');
    }

    // Extract and validate suffix
    const suffix = newPseudo.substring(7);
    if (suffix.length < 1 || suffix.length > 50) {
      throw new Error("Le pseudo doit faire entre 8 et 57 caractères");
    }

    // Validate characters (letters, digits, hyphens, spaces)
    if (!/^[a-zA-Z0-9\s-]+$/.test(suffix)) {
      throw new Error(
        "Le pseudo ne peut contenir que des lettres, chiffres, tirets et espaces",
      );
    }

    // Validate income if provided
    if (newIncome !== undefined && newIncome < 0) {
      throw new Error("Le revenu ne peut pas être négatif");
    }

    // Call gateway
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
  },
);

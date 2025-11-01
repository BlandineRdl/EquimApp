import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../../types/thunk.types";

export const generateInviteLink = createAsyncThunk<
  string,
  { groupId: string },
  AppThunkApiConfig
>(
  "groups/generateInviteLink",
  async (
    { groupId },
    { getState, extra: { groupGateway }, rejectWithValue },
  ) => {
    const state = getState();
    const groupExists = state.groups.entities[groupId];

    if (!groupExists) {
      return rejectWithValue({
        code: "GROUP_NOT_FOUND",
        message: "Groupe non trouvé",
        details: { groupId },
      });
    }

    try {
      const result = await groupGateway.generateInvitation(groupId);
      return result.link;
    } catch (error) {
      return rejectWithValue({
        code: "GENERATE_INVITE_LINK_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la génération du lien d'invitation",
        details: { groupId },
      });
    }
  },
);

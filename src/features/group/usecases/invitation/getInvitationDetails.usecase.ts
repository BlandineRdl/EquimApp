import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../../types/thunk.types";
import type { InvitationPreview } from "../../ports/GroupGateway";

export const getInvitationDetails = createAsyncThunk<
  InvitationPreview | null,
  { token: string },
  AppThunkApiConfig
>(
  "groups/getInvitationDetails",
  async ({ token }, { extra: { groupGateway }, rejectWithValue }) => {
    if (!token || !token.trim()) {
      return rejectWithValue({
        code: "INVALID_INVITATION_TOKEN",
        message: "Token d'invitation invalide",
        details: { token },
      });
    }

    try {
      const invitationDetails = await groupGateway.getInvitationDetails(token);
      return invitationDetails;
    } catch (error) {
      return rejectWithValue({
        code: "GET_INVITATION_DETAILS_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la récupération des détails de l'invitation",
        details: { token },
      });
    }
  },
);

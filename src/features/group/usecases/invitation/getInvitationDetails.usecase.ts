import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import type { GroupGateway, InvitationPreview } from "../../ports/GroupGateway";

export const getInvitationDetails = createAsyncThunk<
  InvitationPreview | null,
  { token: string },
  {
    state: AppState;
    extra: { groupGateway: GroupGateway };
  }
>(
  "groups/getInvitationDetails",
  async ({ token }, { extra: { groupGateway } }) => {
    if (!token || !token.trim()) {
      throw new Error("Token d'invitation invalide");
    }

    const invitationDetails = await groupGateway.getInvitationDetails(token);
    return invitationDetails;
  },
);

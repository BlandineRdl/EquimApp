import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import { INVITATION_TOKEN_PREFIX } from "../../domain/group.constants";
import type { InvitationDetails } from "../../domain/group.model";
import type { GroupGateway } from "../../ports/group.gateway";

export const getInvitationDetails = createAsyncThunk<
  InvitationDetails,
  { token: string },
  {
    state: AppState;
    extra: { groupGateway: GroupGateway };
  }
>(
  "groups/getInvitationDetails",
  async ({ token }, { extra: { groupGateway } }) => {
    if (!token || !token.startsWith(INVITATION_TOKEN_PREFIX)) {
      throw new Error("Token d'invitation invalide");
    }

    const invitationDetails = await groupGateway.getInvitationDetails(token);
    return invitationDetails;
  },
);

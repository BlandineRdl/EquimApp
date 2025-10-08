import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import { INVITATION_TOKEN_PREFIX } from "../../domain/group.constants";
import type { InvitationPreview } from "../../ports/GroupGateway";
import type { GroupGateway } from "../../ports/GroupGateway";

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

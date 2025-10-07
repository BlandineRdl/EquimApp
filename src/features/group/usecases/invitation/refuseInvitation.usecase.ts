import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import { INVITATION_TOKEN_PREFIX } from "../../domain/group.constants";
import type { GroupGateway } from "../../ports/group.gateway";

export const refuseInvitation = createAsyncThunk<
  void,
  { token: string },
  {
    state: AppState;
    extra: { groupGateway: GroupGateway };
  }
>("groups/refuseInvitation", async ({ token }, { extra: { groupGateway } }) => {
  if (!token || !token.startsWith(INVITATION_TOKEN_PREFIX)) {
    throw new Error("Token d'invitation invalide");
  }

  await groupGateway.refuseInvitation(token);
});

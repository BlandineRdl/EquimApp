import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import type { GroupGateway } from "../../ports/group.gateway";

export const generateInviteLink = createAsyncThunk<
  string,
  { groupId: string },
  {
    state: AppState;
    extra: { groupGateway: GroupGateway };
  }
>(
  "groups/generateInviteLink",
  async ({ groupId }, { getState, extra: { groupGateway } }) => {
    const state = getState();
    const groupExists = state.groups.entities[groupId];

    if (!groupExists) {
      throw new Error("Groupe non trouvé");
    }

    const inviteLink = await groupGateway.generateInviteLink(groupId);
    return inviteLink;
  },
);

import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import type { GroupGateway } from "../../ports/GroupGateway";

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

    const result = await groupGateway.generateInvitation(groupId);
    return result.link;
  },
);

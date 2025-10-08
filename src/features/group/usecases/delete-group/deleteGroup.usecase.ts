import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import type { GroupGateway } from "../../ports/GroupGateway";

export interface DeleteGroupInput {
  groupId: string;
}

export const deleteGroup = createAsyncThunk<
  {
    groupId: string;
  },
  DeleteGroupInput,
  {
    state: AppState;
    extra: { groupGateway: GroupGateway };
  }
>(
  "groups/deleteGroup",
  async ({ groupId }, { getState, extra: { groupGateway } }) => {
    // Validate: group exists in state
    const state = getState();
    const group = state.groups.entities[groupId];
    if (!group) {
      throw new Error("Groupe non trouvé");
    }

    // Validate: current user is the creator
    const currentUserId = state.auth.user?.id;
    if (group.creatorId !== currentUserId) {
      throw new Error("Seul le créateur peut supprimer le groupe");
    }

    // Delete group via gateway
    await groupGateway.deleteGroup(groupId);

    return {
      groupId,
    };
  },
);

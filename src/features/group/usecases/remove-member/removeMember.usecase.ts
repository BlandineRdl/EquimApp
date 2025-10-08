import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import type { GroupGateway } from "../../ports/GroupGateway";

export interface RemoveMemberInput {
  groupId: string;
  memberId: string;
}

export const removeMemberFromGroup = createAsyncThunk<
  {
    groupId: string;
    memberId: string;
    shares: any;
  },
  RemoveMemberInput,
  {
    state: AppState;
    extra: { groupGateway: GroupGateway };
  }
>(
  "groups/removeMember",
  async ({ groupId, memberId }, { getState, extra: { groupGateway } }) => {
    // Validate: group exists in state
    const state = getState();
    const group = state.groups.entities[groupId];
    if (!group) {
      throw new Error("Groupe non trouvé");
    }

    // Validate: member exists
    const member = group.members.find((m) => m.id === memberId);
    if (!member) {
      throw new Error("Membre non trouvé");
    }

    // Validate: cannot remove group creator
    if (member.userId === group.creatorId) {
      throw new Error("Impossible de supprimer le créateur du groupe");
    }

    // Remove member via gateway
    const result = await groupGateway.removeMember(groupId, memberId);

    return {
      groupId,
      memberId,
      shares: result.shares,
    };
  },
);

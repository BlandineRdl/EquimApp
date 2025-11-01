import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../../types/thunk.types";
import type { Shares } from "../../ports/GroupGateway";

export interface RemoveMemberInput {
  groupId: string;
  memberId: string;
}

export const removeMemberFromGroup = createAsyncThunk<
  {
    groupId: string;
    memberId: string;
    shares: Shares;
  },
  RemoveMemberInput,
  AppThunkApiConfig
>(
  "groups/removeMember",
  async (
    { groupId, memberId },
    { getState, extra: { groupGateway }, rejectWithValue },
  ) => {
    // Validate: group exists in state
    const state = getState();
    const group = state.groups.entities[groupId];
    if (!group) {
      return rejectWithValue({
        code: "GROUP_NOT_FOUND",
        message: "Groupe non trouvé",
        details: { groupId },
      });
    }

    // Validate: member exists
    const member = group.members.find((m) => m.id === memberId);
    if (!member) {
      return rejectWithValue({
        code: "MEMBER_NOT_FOUND",
        message: "Membre non trouvé",
        details: { groupId, memberId },
      });
    }

    // Validate: cannot remove group creator
    if (member.userId === group.creatorId) {
      return rejectWithValue({
        code: "CANNOT_REMOVE_CREATOR",
        message: "Impossible de supprimer le créateur du groupe",
        details: { groupId, memberId, creatorId: group.creatorId },
      });
    }

    try {
      // Remove member via gateway
      const result = await groupGateway.removeMember(groupId, memberId);

      return {
        groupId,
        memberId,
        shares: result.shares,
      };
    } catch (error) {
      return rejectWithValue({
        code: "REMOVE_MEMBER_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression du membre",
        details: { groupId, memberId },
      });
    }
  },
);

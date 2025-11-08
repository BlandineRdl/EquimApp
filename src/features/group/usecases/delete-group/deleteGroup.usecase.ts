import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../../types/thunk.types";

export interface DeleteGroupInput {
  groupId: string;
}

export const deleteGroup = createAsyncThunk<
  {
    groupId: string;
  },
  DeleteGroupInput,
  AppThunkApiConfig
>(
  "groups/deleteGroup",
  async (
    { groupId },
    { getState, extra: { groupGateway }, rejectWithValue },
  ) => {
    const state = getState();
    const group = state.groups.entities[groupId];
    if (!group) {
      return rejectWithValue({
        code: "GROUP_NOT_FOUND",
        message: "Groupe non trouvé",
        details: { groupId },
      });
    }

    const currentUserId = state.auth.user?.id;
    if (group.creatorId !== currentUserId) {
      return rejectWithValue({
        code: "NOT_GROUP_CREATOR",
        message: "Seul le créateur peut supprimer le groupe",
        details: { groupId, creatorId: group.creatorId, currentUserId },
      });
    }

    try {
      await groupGateway.deleteGroup(groupId);

      return {
        groupId,
      };
    } catch (error) {
      return rejectWithValue({
        code: "DELETE_GROUP_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression du groupe",
        details: { groupId },
      });
    }
  },
);

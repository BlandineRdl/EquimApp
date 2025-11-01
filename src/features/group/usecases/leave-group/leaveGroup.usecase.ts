import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../../types/thunk.types";

export interface LeaveGroupInput {
  groupId: string;
}

export const leaveGroup = createAsyncThunk<
  {
    groupId: string;
    groupDeleted: boolean;
  },
  LeaveGroupInput,
  AppThunkApiConfig
>(
  "groups/leaveGroup",
  async (
    { groupId },
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

    try {
      // Leave group via gateway
      const result = await groupGateway.leaveGroup(groupId);

      return {
        groupId,
        groupDeleted: result.groupDeleted,
      };
    } catch (error) {
      return rejectWithValue({
        code: "LEAVE_GROUP_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la sortie du groupe",
        details: { groupId },
      });
    }
  },
);

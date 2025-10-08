import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import type { GroupGateway } from "../../ports/GroupGateway";

export interface LeaveGroupInput {
	groupId: string;
}

export const leaveGroup = createAsyncThunk<
	{
		groupId: string;
		groupDeleted: boolean;
	},
	LeaveGroupInput,
	{
		state: AppState;
		extra: { groupGateway: GroupGateway };
	}
>(
	"groups/leaveGroup",
	async ({ groupId }, { getState, extra: { groupGateway } }) => {
		// Validate: group exists in state
		const state = getState();
		const group = state.groups.entities[groupId];
		if (!group) {
			throw new Error("Groupe non trouvé");
		}

		// Leave group via gateway
		const result = await groupGateway.leaveGroup(groupId);

		return {
			groupId,
			groupDeleted: result.groupDeleted,
		};
	},
);

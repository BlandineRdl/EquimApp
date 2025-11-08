import { createAsyncThunk } from "@reduxjs/toolkit";
import { logger } from "../../../../lib/logger";
import type { AppState } from "../../../../store/appState";
import type { Group } from "../../domain/manage-group/group.model";
import type { GroupGateway } from "../../ports/GroupGateway";

export const loadUserGroups = createAsyncThunk<
  Group[],
  void,
  {
    state: AppState;
    extra: { groupGateway: GroupGateway };
  }
>("groups/loadUserGroups", async (_, { getState, extra: { groupGateway } }) => {
  const user = getState().auth.user;

  if (!user) {
    throw new Error("User not authenticated");
  }

  logger.debug("Loading groups for user", { userId: user.id });

  const groupSummaries = await groupGateway.getGroupsByUserId(user.id);
  logger.debug("Found groups", { count: groupSummaries.length });

  const fullGroups = await Promise.all(
    groupSummaries.map(async (summary) => {
      logger.debug("Loading details for group", { name: summary.name });
      const fullGroup = await groupGateway.getGroupById(summary.id);
      const group: Group = {
        ...fullGroup,
        totalMonthlyBudget: fullGroup.shares.totalExpenses,
      };
      return group;
    }),
  );

  logger.info("Loaded full groups", { count: fullGroups.length });
  return fullGroups;
});

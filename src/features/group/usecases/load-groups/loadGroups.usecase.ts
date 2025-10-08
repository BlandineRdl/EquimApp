import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import type { Group } from "../../domain/group.model";
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

  console.log("📦 Loading groups for user:", user.id);

  // First, get group summaries
  const groupSummaries = await groupGateway.getGroupsByUserId(user.id);
  console.log("📊 Found groups:", groupSummaries.length);

  // Then, load full details for each group (to get members and expenses)
  const fullGroups = await Promise.all(
    groupSummaries.map(async (summary) => {
      console.log("🔍 Loading details for group:", summary.name);
      const fullGroup = await groupGateway.getGroupById(summary.id);
      // Convert GroupFull to Group by adding computed totalMonthlyBudget
      const group: Group = {
        ...fullGroup,
        totalMonthlyBudget: fullGroup.shares.totalExpenses,
      };
      return group;
    })
  );

  console.log("✅ Loaded full groups:", fullGroups.length);
  return fullGroups;
});

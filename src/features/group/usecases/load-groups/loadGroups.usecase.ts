import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import type { Group } from "../../domain/group.model";
import type { GroupGateway } from "../../ports/group.gateway";

export const loadUserGroups = createAsyncThunk<
  Group[],
  void,
  {
    state: AppState;
    extra: { groupGateway: GroupGateway };
  }
>("groups/loadUserGroups", async (_, { extra: { groupGateway } }) => {
  const groups = await groupGateway.getUserGroups();
  return groups;
});

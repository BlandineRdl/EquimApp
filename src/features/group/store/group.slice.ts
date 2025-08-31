import type { EntityState } from "@reduxjs/toolkit";
import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import { completeOnboarding } from "../../onboarding/usecases/complete-onboarding/completeOnboarding.usecase";
import type { Group } from "../domain/group.model";

export const groupsAdapter = createEntityAdapter<Group>();

interface GroupState extends EntityState<Group, string> {
  loading: boolean;
  error: string | null;
}

const initialState: GroupState = groupsAdapter.getInitialState({
  loading: false,
  error: null,
});

export const groupSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(completeOnboarding.fulfilled, (state, action) => {
      groupsAdapter.addOne(state, action.payload.group);
    });
  },
});

export const groupReducer = groupSlice.reducer;

// src/features/user/store/user.slice.ts
import { createSlice } from "@reduxjs/toolkit";
import { logger } from "../../../lib/logger";
import type { User } from "../domain/user.model";
import { loadUserProfile } from "../usecases/loadUserProfile.usecase";
import { completeOnboarding } from "../../onboarding/usecases/complete-onboarding/completeOnboarding.usecase";

interface UserState {
  profile: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(loadUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load profile";
      })
      // Listen to completeOnboarding to set profile immediately
      .addCase(completeOnboarding.fulfilled, (state, action) => {
        // Profile was just created - set it from the payload
        logger.debug("completeOnboarding.fulfilled received in user slice");
        logger.debug("Payload", { payload: action.payload });
        state.loading = false;
        state.profile = {
          id: action.payload.profileId,
          pseudo: action.payload.profile.pseudo,
          income: action.payload.profile.income,
        };
        logger.debug("Profile set in state", { profile: state.profile });
      });
  },
});

export const { clearUserError } = userSlice.actions;
export const userReducer = userSlice.reducer;

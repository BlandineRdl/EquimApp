// src/features/user/store/user.slice.ts
import { createSlice } from "@reduxjs/toolkit";
import { logger } from "../../../lib/logger";
import { completeOnboarding } from "../../onboarding/usecases/complete-onboarding/completeOnboarding.usecase";
import type { User } from "../domain/user.model";
import { loadUserProfile } from "../usecases/loadUserProfile.usecase";
import { updateUserIncome } from "../usecases/updateUserIncome.usecase";

interface UserState {
  profile: User | null;
  loading: boolean;
  error: string | null;
  previousIncome: number | null; // For optimistic update rollback
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
  previousIncome: null,
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
        if (action.payload) {
          state.profile = {
            ...action.payload,
            shareRevenue: true, // Default value, will be loaded from backend if available
          };
        } else {
          state.profile = null;
        }
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
          monthlyIncome: action.payload.profile.income,
          shareRevenue: true, // Default value from onboarding
        };
        logger.debug("Profile set in state", { profile: state.profile });
      })
      // Update income with optimistic update
      .addCase(updateUserIncome.pending, (state, action) => {
        state.loading = true;
        state.error = null;

        // Optimistic update: save previous income and update immediately
        if (state.profile) {
          state.previousIncome = state.profile.monthlyIncome;
          state.profile.monthlyIncome = action.meta.arg.newIncome;
          logger.debug("Optimistic income update", {
            previous: state.previousIncome,
            new: action.meta.arg.newIncome,
          });
        }
      })
      .addCase(updateUserIncome.fulfilled, (state) => {
        state.loading = false;
        state.previousIncome = null; // Clear rollback data
        logger.info("Income update confirmed");
      })
      .addCase(updateUserIncome.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update income";

        // Rollback optimistic update
        if (state.profile && state.previousIncome !== null) {
          logger.warn("Rolling back income update", {
            failed: state.profile.monthlyIncome,
            rollback: state.previousIncome,
          });
          state.profile.monthlyIncome = state.previousIncome;
          state.previousIncome = null;
        }
      });
  },
});

export const { clearUserError } = userSlice.actions;
export const userReducer = userSlice.reducer;

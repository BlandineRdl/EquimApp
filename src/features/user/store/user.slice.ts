// src/features/user/store/user.slice.ts
import { createSlice } from "@reduxjs/toolkit";
import { logger } from "../../../lib/logger";
import { signOut } from "../../auth/usecases/signOut.usecase";
import { completeOnboarding } from "../../onboarding/usecases/complete-onboarding/completeOnboarding.usecase";
import type { PersonalExpense } from "../domain/personalExpense.model";
import type { User } from "../domain/user.model";
import { addPersonalExpense } from "../usecases/addPersonalExpense.usecase";
import { deletePersonalExpense } from "../usecases/deletePersonalExpense.usecase";
import { loadUserProfile } from "../usecases/loadUserProfile.usecase";
import { updatePersonalExpense } from "../usecases/updatePersonalExpense.usecase";
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

// Helper to recalculate capacity locally
const recalculateCapacity = (state: UserState) => {
  if (state.profile) {
    const totalExpenses =
      state.profile.personalExpenses?.reduce(
        (sum, expense) => sum + expense.amount,
        0,
      ) || 0;
    state.profile.capacity = state.profile.monthlyIncome - totalExpenses;
    logger.debug("[UserSlice] Recalculated capacity", {
      income: state.profile.monthlyIncome,
      expenses: totalExpenses,
      capacity: state.profile.capacity,
    });
  }
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    setPersonalExpenses: (state, action: { payload: PersonalExpense[] }) => {
      if (state.profile) {
        state.profile.personalExpenses = action.payload;
      }
    },
    setCapacity: (state, action: { payload: number | undefined }) => {
      if (state.profile) {
        state.profile.capacity = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserProfile.pending, (state) => {
        logger.debug("[UserSlice] loadUserProfile.pending");
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserProfile.fulfilled, (state, action) => {
        logger.debug("[UserSlice] loadUserProfile.fulfilled", {
          payload: action.payload,
        });
        state.loading = false;
        if (action.payload) {
          state.profile = {
            ...action.payload,
            shareRevenue: true, // Default value, will be loaded from backend if available
            personalExpenses: action.payload.personalExpenses || [],
            capacity: action.payload.capacity,
          };
          logger.info("[UserSlice] Profile set in state", {
            pseudo: state.profile.pseudo,
            hasExpenses: state.profile.personalExpenses?.length > 0,
            capacity: state.profile.capacity,
          });
        } else {
          state.profile = null;
          logger.info("[UserSlice] Profile is null (user needs onboarding)");
        }
      })
      .addCase(loadUserProfile.rejected, (state, action) => {
        logger.error("[UserSlice] loadUserProfile.rejected", {
          error: action.error.message,
          errorName: action.error.name,
          errorStack: action.error.stack,
          payload: action.payload,
        });
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
      // Update income with optimistic update (don't set loading to avoid layout re-render)
      .addCase(updateUserIncome.pending, (state, action) => {
        state.error = null;

        // Optimistic update: save previous income and update immediately
        if (state.profile) {
          state.previousIncome = state.profile.monthlyIncome;
          state.profile.monthlyIncome = action.meta.arg.newIncome;

          // Recalculate capacity (income - personal expenses)
          const totalExpenses = (state.profile.personalExpenses || []).reduce(
            (sum, exp) => sum + exp.amount,
            0,
          );
          state.profile.capacity = action.meta.arg.newIncome - totalExpenses;

          logger.debug("Optimistic income update", {
            previous: state.previousIncome,
            new: action.meta.arg.newIncome,
            newCapacity: state.profile.capacity,
          });
        }
      })
      .addCase(updateUserIncome.fulfilled, (state) => {
        state.previousIncome = null; // Clear rollback data
        logger.info("Income update confirmed");
      })
      .addCase(updateUserIncome.rejected, (state, action) => {
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
      })
      // Personal expenses (don't set loading to avoid re-renders that close modals)
      .addCase(addPersonalExpense.pending, (state) => {
        state.error = null;
      })
      .addCase(addPersonalExpense.fulfilled, (state, action) => {
        // Add the new expense to state (action.payload is the created expense)
        if (state.profile) {
          if (!state.profile.personalExpenses) {
            state.profile.personalExpenses = [];
          }
          state.profile.personalExpenses.push(action.payload);
          logger.debug("[UserSlice] Added expense to state", {
            expense: action.payload,
          });
          // Recalculate capacity locally
          recalculateCapacity(state);
        }
      })
      .addCase(addPersonalExpense.rejected, (state, action) => {
        state.error = action.error.message || "Failed to add personal expense";
      })
      .addCase(updatePersonalExpense.pending, (state) => {
        state.error = null;
      })
      .addCase(updatePersonalExpense.fulfilled, (state, action) => {
        // Update the expense in state (action.payload is the updated expense)
        if (state.profile?.personalExpenses) {
          const index = state.profile.personalExpenses.findIndex(
            (expense) => expense.id === action.payload.id,
          );
          if (index !== -1) {
            state.profile.personalExpenses[index] = action.payload;
            logger.debug("[UserSlice] Updated expense in state", {
              expense: action.payload,
            });
            // Recalculate capacity locally
            recalculateCapacity(state);
          }
        }
      })
      .addCase(updatePersonalExpense.rejected, (state, action) => {
        state.error =
          action.error.message || "Failed to update personal expense";
      })
      .addCase(deletePersonalExpense.pending, (state) => {
        state.error = null;
      })
      .addCase(deletePersonalExpense.fulfilled, (state, action) => {
        // Remove the expense from state (action.payload is the expenseId)
        if (state.profile?.personalExpenses) {
          state.profile.personalExpenses =
            state.profile.personalExpenses.filter(
              (expense) => expense.id !== action.payload,
            );
          logger.debug("[UserSlice] Removed expense from state", {
            expenseId: action.payload,
          });
          // Recalculate capacity locally
          recalculateCapacity(state);
        }
      })
      .addCase(deletePersonalExpense.rejected, (state, action) => {
        state.error =
          action.error.message || "Failed to delete personal expense";
      })
      // Clean up state on sign out
      .addCase(signOut.fulfilled, (state) => {
        logger.debug("[UserSlice] Cleaning up user state on sign out");
        state.profile = null;
        state.loading = false;
        state.error = null;
        state.previousIncome = null;
      });
  },
});

export const { clearUserError, setPersonalExpenses, setCapacity } =
  userSlice.actions;
export const userReducer = userSlice.reducer;

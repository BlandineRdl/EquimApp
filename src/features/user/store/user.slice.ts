import { createSlice } from "@reduxjs/toolkit";
import { logger } from "../../../lib/logger";
import type { AppError } from "../../../types/thunk.types";
import { signOut } from "../../auth/usecases/manage-session/signOut.usecase";
import { completeOnboarding } from "../../onboarding/usecases/complete-onboarding/completeOnboarding.usecase";
import type { PersonalExpense } from "../domain/manage-personal-expenses/personal-expense";
import type { User } from "../domain/manage-profile/profile";
import { addPersonalExpense } from "../usecases/addPersonalExpense.usecase";
import { deletePersonalExpense } from "../usecases/deletePersonalExpense.usecase";
import { loadUserProfile } from "../usecases/loadUserProfile.usecase";
import { updatePersonalExpense } from "../usecases/updatePersonalExpense.usecase";
import { updateUserIncome } from "../usecases/updateUserIncome.usecase";

interface UserState {
  profile: User | null;
  loading: boolean;
  error: AppError | null;
  previousIncome: number | null;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
  previousIncome: null,
};

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
          state.profile = action.payload;
          logger.info("[UserSlice] Profile set in state", {
            pseudo: state.profile.pseudo,
            hasExpenses: (state.profile.personalExpenses?.length ?? 0) > 0,
            capacity: state.profile.capacity,
          });
        } else {
          state.profile = null;
          logger.info("[UserSlice] Profile is null (user needs onboarding)");
        }
      })
      .addCase(loadUserProfile.rejected, (state, action) => {
        logger.error("[UserSlice] loadUserProfile.rejected", {
          error: action.error?.message,
          errorName: action.error?.name,
          errorStack: action.error?.stack,
          payload: action.payload,
        });
        state.loading = false;
        state.error = (action.payload as AppError | undefined) ?? {
          code: "LOAD_PROFILE_FAILED",
          message: action.error?.message ?? "Failed to load profile",
        };
      })
      .addCase(completeOnboarding.fulfilled, (state, action) => {
        logger.debug("completeOnboarding.fulfilled received in user slice", {
          profileId: action.payload.profileId,
        });
        state.loading = false;
      })
      .addCase(updateUserIncome.pending, (state, action) => {
        state.error = null;

        if (state.profile) {
          state.previousIncome = state.profile.monthlyIncome;
          state.profile.monthlyIncome = action.meta.arg.newIncome;

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
        state.previousIncome = null;
        logger.info("Income update confirmed");
      })
      .addCase(updateUserIncome.rejected, (state, action) => {
        state.error = action.payload ?? {
          code: "UPDATE_INCOME_FAILED",
          message: action.error?.message ?? "Failed to update income",
        };

        if (state.profile && state.previousIncome !== null) {
          logger.warn("Rolling back income update", {
            failed: state.profile.monthlyIncome,
            rollback: state.previousIncome,
          });
          state.profile.monthlyIncome = state.previousIncome;
          state.previousIncome = null;
        }
      })
      .addCase(addPersonalExpense.pending, (state) => {
        state.error = null;
      })
      .addCase(addPersonalExpense.fulfilled, (state, action) => {
        if (state.profile) {
          if (!state.profile.personalExpenses) {
            state.profile.personalExpenses = [];
          }
          state.profile.personalExpenses.push(action.payload);
          logger.debug("[UserSlice] Added expense to state", {
            expense: action.payload,
          });
          recalculateCapacity(state);
        }
      })
      .addCase(addPersonalExpense.rejected, (state, action) => {
        state.error = action.payload ?? {
          code: "ADD_EXPENSE_FAILED",
          message: action.error?.message ?? "Failed to add personal expense",
        };
      })
      .addCase(updatePersonalExpense.pending, (state) => {
        state.error = null;
      })
      .addCase(updatePersonalExpense.fulfilled, (state, action) => {
        if (state.profile?.personalExpenses) {
          const index = state.profile.personalExpenses.findIndex(
            (expense) => expense.id === action.payload.id,
          );
          if (index !== -1) {
            state.profile.personalExpenses[index] = action.payload;
            logger.debug("[UserSlice] Updated expense in state", {
              expense: action.payload,
            });
            recalculateCapacity(state);
          }
        }
      })
      .addCase(updatePersonalExpense.rejected, (state, action) => {
        state.error = action.payload ?? {
          code: "UPDATE_EXPENSE_FAILED",
          message: action.error?.message ?? "Failed to update personal expense",
        };
      })
      .addCase(deletePersonalExpense.pending, (state) => {
        state.error = null;
      })
      .addCase(deletePersonalExpense.fulfilled, (state, action) => {
        if (state.profile?.personalExpenses) {
          state.profile.personalExpenses =
            state.profile.personalExpenses.filter(
              (expense) => expense.id !== action.payload,
            );
          logger.debug("[UserSlice] Removed expense from state", {
            expenseId: action.payload,
          });
          recalculateCapacity(state);
        }
      })
      .addCase(deletePersonalExpense.rejected, (state, action) => {
        state.error = action.payload ?? {
          code: "DELETE_EXPENSE_FAILED",
          message: action.error?.message ?? "Failed to delete personal expense",
        };
      })
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

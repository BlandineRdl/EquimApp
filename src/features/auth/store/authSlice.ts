import { createSlice } from "@reduxjs/toolkit";
import type { Session, User } from "@supabase/supabase-js";
import type { AppError } from "../../../types/thunk.types";
import { signInWithEmail } from "../usecases/authenticate-with-email/signInWithEmail.usecase";
import { verifyOtp } from "../usecases/authenticate-with-email/verifyOtp.usecase";
import { deleteAccount } from "../usecases/delete-account/deleteAccount.usecase";
import { initSession } from "../usecases/manage-session/initSession.usecase";
import { signOut } from "../usecases/manage-session/signOut.usecase";
import { resetAccount } from "../usecases/reset-account/resetAccount.usecase";

export interface AuthState {
  user: User | null;
  userId: string | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hydrated: boolean;
  profileDeleted: boolean;
  error: AppError | null;
}

const initialState: AuthState = {
  user: null,
  userId: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  hydrated: false,
  profileDeleted: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action) => {
      const session = action.payload as Session | null;
      state.session = session;
      state.user = session?.user || null;
      state.userId = session?.user?.id || null;
      state.isAuthenticated = !!session;
    },

    clearError: (state) => {
      state.error = null;
    },

    setProfileDeleted: (state, action) => {
      state.profileDeleted = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signInWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInWithEmail.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(signInWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? {
          code: "SIGN_IN_FAILED",
          message: action.error?.message ?? "Failed to sign in",
        };
      });

    builder
      .addCase(signOut.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.userId = null;
        state.session = null;
        state.isAuthenticated = false;
        state.profileDeleted = false;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? {
          code: "SIGN_OUT_FAILED",
          message: action.error?.message ?? "Failed to sign out",
        };
      });

    builder
      .addCase(deleteAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.userId = null;
        state.session = null;
        state.isAuthenticated = false;
        state.profileDeleted = true;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? {
          code: "DELETE_ACCOUNT_FAILED",
          message: action.error?.message ?? "Failed to delete account",
        };
      });

    builder
      .addCase(resetAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetAccount.fulfilled, (state) => {
        state.user = null;
        state.userId = null;
        state.session = null;
        state.isLoading = false;
        state.isAuthenticated = false;
        state.profileDeleted = true;
        state.error = null;
      })
      .addCase(resetAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? {
          code: "RESET_ACCOUNT_FAILED",
          message:
            action.error?.message ??
            "Erreur lors de la réinitialisation du compte",
        };
      });

    builder
      .addCase(initSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.session = action.payload;
        state.user = action.payload?.user || null;
        state.userId = action.payload?.user?.id || null;
        state.isAuthenticated = !!action.payload;
        state.hydrated = true;
      })
      .addCase(initSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? {
          code: "INIT_SESSION_FAILED",
          message: action.error?.message ?? "Failed to initialize session",
        };
        state.hydrated = true;
      });

    builder
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, _action) => {
        state.isLoading = false;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? {
          code: "VERIFY_OTP_FAILED",
          message: action.error?.message ?? "Code de vérification invalide",
        };
      });
  },
});

export const { setSession, clearError, setProfileDeleted } = authSlice.actions;
export default authSlice.reducer;

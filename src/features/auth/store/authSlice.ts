import { createSlice } from "@reduxjs/toolkit";
import type { Session, User } from "@supabase/supabase-js";
import { signInWithEmail } from "../usecases/authenticate-with-email/signInWithEmail.usecase";
import { verifyOtp } from "../usecases/authenticate-with-email/verifyOtp.usecase";
import { deleteAccount } from "../usecases/delete-account/deleteAccount.usecase";
import { initSession } from "../usecases/manage-session/initSession.usecase";
import { signOut } from "../usecases/manage-session/signOut.usecase";
import { resetAccount } from "../usecases/reset-account/resetAccount.usecase";

// State interface
export interface AuthState {
  user: User | null;
  userId: string | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hydrated: boolean; // True once initial session check is complete
  profileDeleted: boolean;
  error: string | null;
}

// Initial state
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

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Update session from auth state change listener
    setSession: (state, action) => {
      const session = action.payload as Session | null;
      state.session = session;
      state.user = session?.user || null;
      state.userId = session?.user?.id || null;
      state.isAuthenticated = !!session;
    },

    // Reset error
    clearError: (state) => {
      state.error = null;
    },

    // Mark profile as deleted (for handling soft-deleted users)
    setProfileDeleted: (state, action) => {
      state.profileDeleted = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Sign in
    builder
      .addCase(signInWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInWithEmail.fulfilled, (state) => {
        state.isLoading = false;
        // Magic link sent successfully
      })
      .addCase(signInWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to sign in";
      });

    // Sign out
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
        state.error = action.error.message || "Failed to sign out";
      });

    // Delete account
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
        state.error = action.error.message || "Failed to delete account";
      });

    // Reset account
    builder
      .addCase(resetAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetAccount.fulfilled, (state) => {
        // Reset all auth state
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
        state.error =
          action.error.message ||
          "Erreur lors de la réinitialisation du compte";
      });

    // Init session
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
        state.hydrated = true; // Mark as hydrated after initial session check
      })
      .addCase(initSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to initialize session";
        state.hydrated = true; // Mark as hydrated even on error
      });

    // Verify OTP
    builder
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, _action) => {
        state.isLoading = false;
        // Session will be set by onAuthStateChange listener
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Code de vérification invalide";
      });
  },
});

export const { setSession, clearError, setProfileDeleted } = authSlice.actions;
export default authSlice.reducer;

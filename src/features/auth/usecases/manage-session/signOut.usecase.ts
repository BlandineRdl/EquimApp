import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../../types/thunk.types";

export const signOut = createAsyncThunk<void, void, AppThunkApiConfig>(
  "auth/signOut",
  async (_, { extra: { authGateway }, rejectWithValue }) => {
    try {
      await authGateway.signOut();
    } catch (error) {
      return rejectWithValue({
        code: "SIGN_OUT_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la déconnexion",
      });
    }
  },
);

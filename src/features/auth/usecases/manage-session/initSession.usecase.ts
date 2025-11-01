import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Session } from "@supabase/supabase-js";
import type { AppThunkApiConfig } from "../../../../types/thunk.types";

export const initSession = createAsyncThunk<
  Session | null,
  void,
  AppThunkApiConfig
>(
  "auth/initSession",
  async (_, { extra: { authGateway }, rejectWithValue }) => {
    try {
      return await authGateway.getSession();
    } catch (error) {
      return rejectWithValue({
        code: "INIT_SESSION_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'initialisation de la session",
      });
    }
  },
);

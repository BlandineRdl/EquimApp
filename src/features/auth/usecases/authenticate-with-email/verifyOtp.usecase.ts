import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../../types/thunk.types";

export const verifyOtp = createAsyncThunk<
  void,
  { email: string; token: string },
  AppThunkApiConfig
>(
  "auth/verifyOtp",
  async ({ email, token }, { extra: { authGateway }, rejectWithValue }) => {
    try {
      await authGateway.verifyOtp(email, token);
    } catch (error) {
      return rejectWithValue({
        code: "VERIFY_OTP_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la vérification du code",
        details: { email },
      });
    }
  },
);

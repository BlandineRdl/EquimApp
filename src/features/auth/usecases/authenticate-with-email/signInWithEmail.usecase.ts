import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../../types/thunk.types";
import { validateEmail } from "../../domain/authenticate-with-email/validate-email";

export const signInWithEmail = createAsyncThunk<
  void,
  string,
  AppThunkApiConfig
>("auth/signIn", async (email, { extra: { authGateway }, rejectWithValue }) => {
  try {
    const normalizedEmail = validateEmail(email);

    await authGateway.signInWithEmail(normalizedEmail);
  } catch (error) {
    return rejectWithValue({
      code: "SIGN_IN_FAILED",
      message:
        error instanceof Error ? error.message : "Erreur lors de la connexion",
      details: { email },
    });
  }
});

import { createAsyncThunk } from "@reduxjs/toolkit";
import { validateEmail } from "../../domain/authenticate-with-email/validate-email";
import type { AuthGateway } from "../../ports/AuthGateway";

export const signInWithEmail = createAsyncThunk<
  void,
  string,
  { extra: { authGateway: AuthGateway } }
>("auth/signIn", async (email, { extra: { authGateway } }) => {
  // Validate and normalize email
  const normalizedEmail = validateEmail(email);

  // Send magic link
  await authGateway.signInWithEmail(normalizedEmail);
});

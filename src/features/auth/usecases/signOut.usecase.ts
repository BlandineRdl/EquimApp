import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AuthGateway } from "../ports/AuthGateway";

export const signOut = createAsyncThunk<
  void,
  void,
  { extra: { authGateway: AuthGateway } }
>("auth/signOut", async (_, { extra: { authGateway } }) => {
  await authGateway.signOut();
});

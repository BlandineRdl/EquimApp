import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AuthGateway } from "../../ports/AuthGateway";

export const deleteAccount = createAsyncThunk<
  void,
  void,
  { extra: { authGateway: AuthGateway } }
>("auth/deleteAccount", async (_, { extra: { authGateway } }) => {
  await authGateway.deleteAccount();
});

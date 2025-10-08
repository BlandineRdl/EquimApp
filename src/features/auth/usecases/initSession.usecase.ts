import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Session } from "@supabase/supabase-js";
import type { AuthGateway } from "../ports/AuthGateway";

export const initSession = createAsyncThunk<
  Session | null,
  void,
  { extra: { authGateway: AuthGateway } }
>("auth/initSession", async (_, { extra: { authGateway } }) => {
  return await authGateway.getSession();
});

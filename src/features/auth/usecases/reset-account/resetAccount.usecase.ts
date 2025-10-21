import { createAsyncThunk } from "@reduxjs/toolkit";
import { logger } from "../../../../lib/logger";
import type { AuthGateway } from "../../ports/AuthGateway";

export const resetAccount = createAsyncThunk<
  void,
  void,
  {
    extra: {
      authGateway: AuthGateway;
    };
  }
>("auth/resetAccount", async (_, { extra }) => {
  logger.info("[resetAccount] Starting account reset");

  await extra.authGateway.resetAccount();

  logger.info("[resetAccount] Account reset successful");
});

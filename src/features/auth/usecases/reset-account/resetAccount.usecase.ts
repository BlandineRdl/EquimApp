import { createAsyncThunk } from "@reduxjs/toolkit";
import { logger } from "../../../../lib/logger";
import type { AppThunkApiConfig } from "../../../../types/thunk.types";

export const resetAccount = createAsyncThunk<void, void, AppThunkApiConfig>(
  "auth/resetAccount",
  async (_, { extra, rejectWithValue }) => {
    logger.info("[resetAccount] Starting account reset");

    try {
      await extra.authGateway.resetAccount();

      logger.info("[resetAccount] Account reset successful");
    } catch (error) {
      return rejectWithValue({
        code: "RESET_ACCOUNT_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la réinitialisation du compte",
      });
    }
  },
);

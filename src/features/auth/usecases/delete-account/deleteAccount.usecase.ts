import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../../types/thunk.types";

export const deleteAccount = createAsyncThunk<void, void, AppThunkApiConfig>(
  "auth/deleteAccount",
  async (_, { extra: { authGateway }, rejectWithValue }) => {
    try {
      await authGateway.deleteAccount();
    } catch (error) {
      return rejectWithValue({
        code: "DELETE_ACCOUNT_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression du compte",
      });
    }
  },
);

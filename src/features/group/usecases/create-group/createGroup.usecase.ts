import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppThunkApiConfig } from "../../../../types/thunk.types";

export interface CreateGroupInput {
  name: string;
  currency?: string;
}

export const createGroup = createAsyncThunk<
  {
    groupId: string;
  },
  CreateGroupInput,
  AppThunkApiConfig
>(
  "groups/createGroup",
  async (
    { name, currency = "EUR" },
    { extra: { groupGateway }, rejectWithValue },
  ) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return rejectWithValue({
        code: "EMPTY_GROUP_NAME",
        message: "Le nom du groupe ne peut pas être vide",
      });
    }

    if (trimmedName.length < 2) {
      return rejectWithValue({
        code: "GROUP_NAME_TOO_SHORT",
        message: "Le nom du groupe doit contenir au moins 2 caractères",
        details: { minLength: 2, actualLength: trimmedName.length },
      });
    }

    if (trimmedName.length > 50) {
      return rejectWithValue({
        code: "GROUP_NAME_TOO_LONG",
        message: "Le nom du groupe ne peut pas dépasser 50 caractères",
        details: { maxLength: 50, actualLength: trimmedName.length },
      });
    }

    try {
      const result = await groupGateway.createGroup(trimmedName, currency);

      return {
        groupId: result.groupId,
      };
    } catch (error) {
      return rejectWithValue({
        code: "GROUP_CREATION_FAILED",
        message: "Erreur lors de la création du groupe",
        details: { error },
      });
    }
  },
);

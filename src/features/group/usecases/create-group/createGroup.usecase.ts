import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import type { GroupGateway } from "../../ports/GroupGateway";

export interface CreateGroupInput {
  name: string;
  currency?: string;
}

export const createGroup = createAsyncThunk<
  {
    groupId: string;
  },
  CreateGroupInput,
  {
    state: AppState;
    extra: { groupGateway: GroupGateway };
  }
>(
  "groups/createGroup",
  async ({ name, currency = "EUR" }, { extra: { groupGateway } }) => {
    // Validate group name
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("Le nom du groupe ne peut pas être vide");
    }

    if (trimmedName.length < 2) {
      throw new Error("Le nom du groupe doit contenir au moins 2 caractères");
    }

    if (trimmedName.length > 50) {
      throw new Error("Le nom du groupe ne peut pas dépasser 50 caractères");
    }

    // Create group via gateway
    const result = await groupGateway.createGroup(trimmedName, currency);

    return {
      groupId: result.groupId,
    };
  },
);

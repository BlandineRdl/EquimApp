import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import { MemberValidationService } from "../../domain/memberValidation.service";
import type {
  GroupGateway,
  GroupMember,
  Shares,
} from "../../ports/GroupGateway";

export interface AddMemberData {
  pseudo: string;
  monthlyIncome: number;
}

export const addMemberToGroup = createAsyncThunk<
  {
    groupId: string;
    newMember: GroupMember;
    shares: Shares;
  },
  { groupId: string; memberData: AddMemberData },
  {
    state: AppState;
    extra: { groupGateway: GroupGateway };
  }
>(
  "groups/addMemberToGroup",
  async ({ groupId, memberData }, { getState, extra: { groupGateway } }) => {
    // Normalize data first (trim, parse, etc.)
    const normalizedData =
      MemberValidationService.normalizeMemberData(memberData);

    // Validate member data using domain service
    const validation =
      MemberValidationService.validateMemberData(normalizedData);
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    // Vérifier que le groupe existe (logique métier)
    const state = getState();
    const groupExists = state.groups.entities[groupId];
    if (!groupExists) {
      throw new Error("Groupe non trouvé");
    }

    // Add phantom member via gateway
    const result = await groupGateway.addPhantomMember(
      groupId,
      normalizedData.pseudo,
      normalizedData.monthlyIncome,
    );

    // Create the new member object with the ID returned from backend
    const newMember: GroupMember = {
      id: result.memberId,
      userId: null,
      pseudo: normalizedData.pseudo,
      shareRevenue: true,
      incomeOrWeight: normalizedData.monthlyIncome,
      joinedAt: new Date().toISOString(),
      isPhantom: true,
    };

    return {
      groupId,
      newMember,
      shares: result.shares,
    };
  },
);

import { createSelector } from "@reduxjs/toolkit";
import { logger } from "../../../../lib/logger";
import type { AppState } from "../../../../store/appState";
import { selectUserRemainingCapacity } from "../../../user/presentation/budget/selectors/selectUserRemainingCapacity.selector";
import type { GroupMember as StoreGroupMember } from "../../domain/manage-group/group.model";
import type { MemberShare } from "../../ports/GroupGateway";
import { selectGroupById } from "./selectGroup.selector";

export interface GroupMemberWithShare extends StoreGroupMember {
  sharePercentage: number;
  shareAmount: number;
  remainingAfterShare: number;
}

export const selectGroupDetails = createSelector(
  [
    (state: AppState, groupId: string) => selectGroupById(state, groupId),
    (state: AppState) => selectUserRemainingCapacity(state),
    (state: AppState) => state.auth.user?.id,
  ],
  (group, userRemainingCapacity, currentUserId) => {
    if (!group) {
      return null;
    }

    const members = group.members || [];

    const totalIncome = members.reduce(
      (sum, member) => sum + (member.incomeOrWeight || 0),
      0,
    );

    const totalExpenses = group.shares?.totalExpenses || 0;

    const sharesByMemberId = new Map(
      group.shares?.shares.map((share: MemberShare) => [
        share.memberId,
        share,
      ]) || [],
    );

    const membersWithShares: GroupMemberWithShare[] = members.map((member) => {
      const share = sharesByMemberId.get(member.id);
      const shareAmount = share?.shareAmount || 0;
      const monthlyCapacity = member.monthlyCapacity || 0;

      let remainingAfterShare: number;

      if (member.userId === currentUserId && userRemainingCapacity) {
        remainingAfterShare = userRemainingCapacity.remainingAfterAllGroups;
      } else {
        remainingAfterShare = monthlyCapacity - shareAmount;
      }

      logger.debug(`Member mapping`, {
        pseudo: member.pseudo,
        id: member.id,
        userId: member.userId,
        isCurrentUser: member.userId === currentUserId,
        share,
        monthlyCapacity,
        shareAmount,
        remainingAfterShare,
      });

      return {
        ...member,
        sharePercentage: share?.sharePercentage || 0,
        shareAmount,
        remainingAfterShare,
      };
    });

    return {
      group,
      members: membersWithShares,
      totalIncome,
      totalBudget: totalExpenses,
      expensesCount: group.expenses?.length || 0,
    };
  },
);

export const selectGroupStats = createSelector(
  [selectGroupDetails],
  (groupDetails) => {
    if (!groupDetails) return null;

    return {
      totalBudget: groupDetails.totalBudget,
      expensesCount: groupDetails.expensesCount,
      membersCount: groupDetails.members.length,
      averageIncome: groupDetails.totalIncome / groupDetails.members.length,
    };
  },
);

export const selectGroupExpenses = createSelector(
  [selectGroupDetails],
  (groupDetails) => {
    if (!groupDetails) return [];

    return groupDetails.group.expenses.map((expense) => ({
      ...expense,
      frequency: "Mensuel" as const,
    }));
  },
);

export const selectMaxShareAmount = createSelector(
  [selectGroupDetails],
  (groupDetails) => {
    if (!groupDetails || groupDetails.members.length === 0) return 0;

    return Math.max(...groupDetails.members.map((m) => m.shareAmount));
  },
);

export const selectMaxSharePercentage = createSelector(
  [selectGroupDetails],
  (groupDetails) => {
    if (!groupDetails || groupDetails.members.length === 0) return 0;

    return Math.max(...groupDetails.members.map((m) => m.sharePercentage));
  },
);

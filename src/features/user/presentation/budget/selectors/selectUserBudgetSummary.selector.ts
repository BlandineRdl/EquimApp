import { createSelector } from "@reduxjs/toolkit";
import { selectAllGroups } from "../../../../group/presentation/manage-groups/selectGroup.selector";
import { selectUserProfile } from "../../selectors/selectUser.selector";
import { selectUserRemainingCapacity } from "./selectUserRemainingCapacity.selector";

export interface GroupShareInfo {
  groupId: string;
  groupName: string;
  sharePercentage: number;
  shareAmount: number;
}

export interface UserBudgetSummary {
  income: number;
  capacity: number;
  groupShares: GroupShareInfo[];
  totalGroupContributions: number;
  remainingBudget: number;
  expenseRatio: number;
  isHealthy: boolean;
  hasGroups: boolean;
  hasValidCapacity: boolean;
}

export const selectUserBudgetSummary = createSelector(
  [selectUserProfile, selectAllGroups, selectUserRemainingCapacity],
  (user, groups, remainingCapacity): UserBudgetSummary | null => {
    if (!user || !remainingCapacity) {
      return null;
    }

    const income = user.monthlyIncome || 0;
    const capacity = remainingCapacity.monthlyCapacity;
    const userId = user.id;

    const hasValidCapacity = capacity > 0;

    const groupShares: GroupShareInfo[] = groups
      .map((group) => {
        const userShare = group.shares?.shares.find(
          (share) => share.userId === userId,
        );

        if (!userShare) {
          return null;
        }

        return {
          groupId: group.id,
          groupName: group.name,
          sharePercentage: userShare.sharePercentage,
          shareAmount: userShare.shareAmount,
        };
      })
      .filter((share): share is GroupShareInfo => share !== null);

    const totalGroupContributions = remainingCapacity.totalGroupContributions;
    const remainingBudget = remainingCapacity.remainingAfterAllGroups;

    const expenseRatio = hasValidCapacity
      ? Math.round((totalGroupContributions / capacity) * 100)
      : 0;

    const isHealthy = !remainingCapacity.isNegative;

    return {
      income,
      capacity,
      groupShares,
      totalGroupContributions,
      remainingBudget,
      expenseRatio,
      isHealthy,
      hasGroups: groupShares.length > 0,
      hasValidCapacity,
    };
  },
);

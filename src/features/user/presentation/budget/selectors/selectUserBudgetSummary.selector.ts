import { createSelector } from "@reduxjs/toolkit";
import { selectAllGroups } from "../../../../group/presentation/manage-groups/selectGroup.selector";
import { selectUserProfile } from "../../selectors/selectUser.selector";

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

/**
 * Selector that aggregates user budget data from profile and groups
 * Calculates total contributions, remaining budget, and expense ratio
 */
export const selectUserBudgetSummary = createSelector(
  [selectUserProfile, selectAllGroups],
  (user, groups): UserBudgetSummary | null => {
    if (!user) {
      return null;
    }

    const income = user.monthlyIncome || 0;
    const capacity = user.capacity || 0;
    const userId = user.id;

    // Handle edge case: capacity is 0 or negative
    const hasValidCapacity = capacity > 0;

    // Calculate group shares for this user
    const groupShares: GroupShareInfo[] = groups
      .map((group) => {
        // Find user's share in this group
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

    // Calculate total group contributions
    const totalGroupContributions = groupShares.reduce(
      (sum, share) => sum + share.shareAmount,
      0,
    );

    // Calculate remaining budget after group contributions
    const remainingBudget = capacity - totalGroupContributions;

    // Calculate expense ratio (percentage of capacity used)
    // Handle division by zero
    const expenseRatio = hasValidCapacity
      ? Math.round((totalGroupContributions / capacity) * 100)
      : 0;

    // Determine if budget is healthy (not negative)
    const isHealthy = remainingBudget >= 0;

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

import { createSelector } from "@reduxjs/toolkit";
import { selectAllGroups } from "../../../../group/presentation/manage-groups/selectGroup.selector";
import { selectUserProfile } from "../../selectors/selectUser.selector";

export interface UserRemainingCapacity {
  monthlyCapacity: number;
  totalGroupContributions: number;
  remainingAfterAllGroups: number;
  isNegative: boolean;
}

export const selectUserRemainingCapacity = createSelector(
  [selectUserProfile, selectAllGroups],
  (user, groups): UserRemainingCapacity | null => {
    if (!user) {
      return null;
    }

    const monthlyCapacity = user.capacity || 0;
    const userId = user.id;

    const totalGroupContributions = groups.reduce((total, group) => {
      const userShare = group.shares?.shares.find(
        (share) => share.userId === userId,
      );

      if (!userShare) {
        return total;
      }

      return total + userShare.shareAmount;
    }, 0);

    const remainingAfterAllGroups = monthlyCapacity - totalGroupContributions;

    return {
      monthlyCapacity,
      totalGroupContributions,
      remainingAfterAllGroups,
      isNegative: remainingAfterAllGroups < 0,
    };
  },
);

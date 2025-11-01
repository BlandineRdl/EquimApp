import { createSelector } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import { selectAddExpenseUI, selectAddMemberUI } from "./selectGroup.selector";
import {
  selectGroupDetails,
  selectGroupExpenses,
  selectGroupStats,
  selectMaxShareAmount,
  selectMaxSharePercentage,
} from "./selectGroupDetails.selector";

/**
 * Consolidated View Model Selector for GroupDetailsScreen
 * Combines all UI-related state into a single object to minimize useSelector calls
 */
export const selectGroupDetailsUIViewModel = createSelector(
  [
    (state: AppState, groupId: string) =>
      groupId ? selectGroupDetails(state, groupId) : null,
    (state: AppState, groupId: string) =>
      groupId ? selectGroupStats(state, groupId) : null,
    (state: AppState, groupId: string) =>
      groupId ? selectGroupExpenses(state, groupId) : [],
    (state: AppState, groupId: string) =>
      groupId ? selectMaxShareAmount(state, groupId) : 0,
    (state: AppState, groupId: string) =>
      groupId ? selectMaxSharePercentage(state, groupId) : 0,
    selectAddMemberUI,
    selectAddExpenseUI,
    (state: AppState) => state.auth.user?.id,
  ],
  (
    groupDetails,
    groupStats,
    expenses,
    maxShareAmount,
    maxSharePercentage,
    addMemberUI,
    addExpenseUI,
    currentUserId,
  ) => ({
    groupDetails,
    groupStats,
    expenses,
    maxShareAmount,
    maxSharePercentage,
    addMemberUI,
    addExpenseUI,
    currentUserId,
    isLoading: !groupDetails || !groupStats,
    isCreator: groupDetails?.group.creatorId === currentUserId,
  }),
);

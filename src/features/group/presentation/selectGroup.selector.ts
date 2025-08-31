// src/features/group/store/selectGroup.selector.ts
import { createSelector } from "@reduxjs/toolkit";
import type { AppState } from "../../../store/appState";
import { groupsAdapter } from "../store/group.slice";

const selectGroupsState = (state: AppState) => state.groups;

// Selectors de base générés par l'adapter
const groupSelectors = groupsAdapter.getSelectors();

export const selectAllGroups = createSelector(
  [selectGroupsState],
  (groupsState) => groupSelectors.selectAll(groupsState),
);

export const selectGroupById = createSelector(
  [selectGroupsState, (_, groupId: string) => groupId],
  (groupsState, groupId) => groupSelectors.selectById(groupsState, groupId),
);

export const selectGroupIds = createSelector(
  [selectGroupsState],
  (groupsState) => groupSelectors.selectIds(groupsState),
);

// Selectors pour l'état de chargement
export const selectGroupsLoading = createSelector(
  [selectGroupsState],
  (groupsState) => groupsState.loading,
);

export const selectGroupsError = createSelector(
  [selectGroupsState],
  (groupsState) => groupsState.error,
);

// Selectors composés utiles
export const selectGroupsCount = createSelector(
  [selectAllGroups],
  (groups) => groups.length,
);

export const selectHasGroups = createSelector(
  [selectGroupsCount],
  (count) => count > 0,
);

export const selectTotalMonthlyBudget = createSelector(
  [selectAllGroups],
  (groups) =>
    groups.reduce((total, group) => total + group.totalMonthlyBudget, 0),
);

// Selector pour l'UI de l'écran d'accueil
export const selectGroupsUI = createSelector(
  [selectAllGroups, selectGroupsLoading, selectGroupsError, selectGroupsCount],
  (groups, loading, error, count) => ({
    groups,
    loading,
    error,
    count,
    hasGroups: count > 0,
    isEmpty: count === 0 && !loading,
    sectionTitle: count > 1 ? "Mes groupes" : "Mon groupe",
  }),
);

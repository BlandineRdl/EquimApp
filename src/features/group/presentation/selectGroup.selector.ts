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

export const selectAddMemberForm = createSelector(
  [selectGroupsState],
  (groupsState) => groupsState.addMemberForm,
);

export const selectAddMemberUI = createSelector(
  [selectAddMemberForm, selectGroupsLoading, selectGroupsError],
  (form, loading, error) => ({
    isOpen: !!form,
    form,
    loading,
    error,
    canSubmit: form
      ? form.pseudo.trim() && parseFloat(form.monthlyIncome) > 0
      : false,
  }),
);

export const selectAddExpenseForm = createSelector(
  [selectGroupsState],
  // @ts-expect-error - addExpenseForm exists in GroupState
  (groupsState) => groupsState.addExpenseForm,
);

export const selectAddExpenseUI = createSelector(
  [selectAddExpenseForm, selectGroupsLoading, selectGroupsError],
  (form, loading, error) => ({
    isOpen: !!form,
    form,
    loading,
    error,
    canSubmit: form ? form.name.trim() && parseFloat(form.amount) > 0 : false,
  }),
);

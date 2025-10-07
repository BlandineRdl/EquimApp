import { createSelector } from "@reduxjs/toolkit";
import type { AppState } from "../../../store/appState";
import { groupsAdapter } from "../store/group.slice";

// Selectors générés par l'adapter
const adapterSelectors = groupsAdapter.getSelectors<AppState>(
  (state) => state.groups,
);

// Sélecteurs pour les membres d'un groupe spécifique
export const selectGroupMembersCount = (groupId: string) =>
  createSelector(
    [(state: AppState) => adapterSelectors.selectById(state, groupId)],
    (group) => group?.members?.length ?? 0,
  );

export const selectGroupMembers = (groupId: string) =>
  createSelector(
    [(state: AppState) => adapterSelectors.selectById(state, groupId)],
    (group) => group?.members ?? [],
  );

export const selectGroupMemberNames = (groupId: string) =>
  createSelector([selectGroupMembers(groupId)], (members) =>
    members.map((member) => member.pseudo),
  );

export const selectGroupMemberNamesFormatted = (groupId: string) =>
  createSelector([selectGroupMemberNames(groupId)], (memberNames) => {
    if (memberNames.length === 0) {
      return "Aucun membre";
    }

    if (memberNames.length === 1) {
      return memberNames[0];
    }

    if (memberNames.length === 2) {
      return `${memberNames[0]} et ${memberNames[1]}`;
    }

    if (memberNames.length === 3) {
      return `${memberNames[0]}, ${memberNames[1]} et ${memberNames[2]}`;
    }

    const firstThree = memberNames.slice(0, 3);
    const remaining = memberNames.length - 3;
    return `${firstThree.join(", ")} et ${remaining} autre${remaining > 1 ? "s" : ""}`;
  });

import { createSelector } from "@reduxjs/toolkit";
import type { AppState } from "../../../store/appState";
import type { GroupMember as StoreGroupMember } from "../domain/group.model";
import { selectGroupById } from "./selectGroup.selector";

// Interface pour un membre du groupe avec sa quote-part calculée
export interface GroupMemberWithShare extends StoreGroupMember {
  sharePercentage: number;
  shareAmount: number;
}

// Selector pour obtenir les détails complets d'un groupe avec quotes-parts
export const selectGroupDetails = createSelector(
  [(state: AppState, groupId: string) => selectGroupById(state, groupId)],
  (group) => {
    if (!group) return null;

    // Utiliser les membres du store
    const members = group.members;

    // Calcul du total des revenus
    const totalIncome = members.reduce(
      (sum, member) => sum + member.monthlyIncome,
      0,
    );

    // Calcul des quotes-parts proportionnelles
    const membersWithShares: GroupMemberWithShare[] = members.map((member) => ({
      ...member,
      sharePercentage: Math.round((member.monthlyIncome / totalIncome) * 100),
      shareAmount:
        (member.monthlyIncome / totalIncome) * group.totalMonthlyBudget,
    }));

    return {
      group,
      members: membersWithShares,
      totalIncome,
      totalBudget: group.totalMonthlyBudget,
      expensesCount: group.expenses.length,
    };
  },
);

// Selector pour obtenir les statistiques d'un groupe
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

// Selector pour la liste des dépenses du groupe
export const selectGroupExpenses = createSelector(
  [selectGroupDetails],
  (groupDetails) => {
    if (!groupDetails) return [];

    return groupDetails.group.expenses.map((expense) => ({
      ...expense,
      frequency: "Mensuel" as const, // Pour l'affichage
    }));
  },
);

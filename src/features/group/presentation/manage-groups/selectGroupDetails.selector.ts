import { createSelector } from "@reduxjs/toolkit";
import { logger } from "../../../../lib/logger";
import type { AppState } from "../../../../store/appState";
import { selectUserRemainingCapacity } from "../../../user/presentation/budget/selectors/selectUserRemainingCapacity.selector";
import type { GroupMember as StoreGroupMember } from "../../domain/manage-group/group.model";
import type { MemberShare } from "../../ports/GroupGateway";
import { selectGroupById } from "./selectGroup.selector";

// Interface pour un membre du groupe avec sa quote-part calculée
export interface GroupMemberWithShare extends StoreGroupMember {
  sharePercentage: number;
  shareAmount: number;
  remainingAfterShare: number; // Reste à vivre après contribution au groupe
}

// Selector pour obtenir les détails complets d'un groupe avec quotes-parts
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

    // Utiliser les membres du store
    const members = group.members || [];

    // Calcul du total des revenus (incomeOrWeight)
    const totalIncome = members.reduce(
      (sum, member) => sum + (member.incomeOrWeight || 0),
      0,
    );

    // Utiliser les shares depuis le backend (déjà calculés)
    const totalExpenses = group.shares?.totalExpenses || 0;

    const sharesByMemberId = new Map(
      group.shares?.shares.map((share: MemberShare) => [
        share.memberId,
        share,
      ]) || [],
    );

    // Mapper les membres avec leurs shares
    const membersWithShares: GroupMemberWithShare[] = members.map((member) => {
      const share = sharesByMemberId.get(member.id);
      const shareAmount = share?.shareAmount || 0;
      const monthlyCapacity = member.monthlyCapacity || 0;

      // Pour l'utilisateur connecté, utiliser le calcul centralisé (reste à vivre global)
      // Pour les autres membres, calculer le reste à vivre local (juste pour ce groupe)
      let remainingAfterShare: number;

      if (member.userId === currentUserId && userRemainingCapacity) {
        // Utilisateur connecté : reste à vivre après TOUS les groupes
        remainingAfterShare = userRemainingCapacity.remainingAfterAllGroups;
      } else {
        // Autre membre : reste à vivre après CE groupe uniquement
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

// Selector pour obtenir la quote-part maximale du groupe
export const selectMaxShareAmount = createSelector(
  [selectGroupDetails],
  (groupDetails) => {
    if (!groupDetails || groupDetails.members.length === 0) return 0;

    return Math.max(...groupDetails.members.map((m) => m.shareAmount));
  },
);

// Selector pour obtenir le pourcentage de quote-part maximal du groupe
export const selectMaxSharePercentage = createSelector(
  [selectGroupDetails],
  (groupDetails) => {
    if (!groupDetails || groupDetails.members.length === 0) return 0;

    return Math.max(...groupDetails.members.map((m) => m.sharePercentage));
  },
);

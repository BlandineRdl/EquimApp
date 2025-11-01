import { createSelector } from "@reduxjs/toolkit";
import { logger } from "../../../../lib/logger";
import type { AppState } from "../../../../store/appState";
import type { GroupMember as StoreGroupMember } from "../../domain/manage-group/group.model";
import type { MemberShare } from "../../ports/GroupGateway";
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

    // DEBUG: Log pour voir ce qui arrive du backend
    logger.debug("DEBUG shares from backend", { shares: group.shares });
    logger.debug("DEBUG members", {
      members: members.map((m) => ({ id: m.id, pseudo: m.pseudo })),
    });

    const sharesByMemberId = new Map(
      group.shares?.shares.map((share: MemberShare) => [
        share.memberId,
        share,
      ]) || [],
    );

    // Mapper les membres avec leurs shares
    const membersWithShares: GroupMemberWithShare[] = members.map((member) => {
      const share = sharesByMemberId.get(member.id);
      logger.debug(`Member mapping`, {
        pseudo: member.pseudo,
        id: member.id,
        share,
      });
      return {
        ...member,
        sharePercentage: share?.sharePercentage || 0,
        shareAmount: share?.shareAmount || 0,
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

import { createSelector } from "@reduxjs/toolkit";
import { selectAllGroups } from "../../../../group/presentation/manage-groups/selectGroup.selector";
import { selectUserProfile } from "../../selectors/selectUser.selector";

/**
 * Interface pour le reste à vivre de l'utilisateur
 */
export interface UserRemainingCapacity {
  monthlyCapacity: number; // Revenu - dépenses personnelles
  totalGroupContributions: number; // Somme de toutes les participations aux groupes
  remainingAfterAllGroups: number; // Reste à vivre après toutes les participations
  isNegative: boolean; // True si le reste à vivre est négatif
}

/**
 * Sélecteur centralisé pour calculer le reste à vivre global de l'utilisateur
 * Prend en compte toutes les participations aux groupes
 *
 * Formule:
 * remainingAfterAllGroups = monthlyCapacity - totalGroupContributions
 *
 * Où:
 * - monthlyCapacity = revenu mensuel - dépenses personnelles (calculé côté backend)
 * - totalGroupContributions = somme de toutes les shareAmount de tous les groupes
 */
export const selectUserRemainingCapacity = createSelector(
  [selectUserProfile, selectAllGroups],
  (user, groups): UserRemainingCapacity | null => {
    if (!user) {
      return null;
    }

    const monthlyCapacity = user.capacity || 0;
    const userId = user.id;

    // Calculer la somme de toutes les participations aux groupes
    const totalGroupContributions = groups.reduce((total, group) => {
      // Trouver la participation de l'utilisateur dans ce groupe
      const userShare = group.shares?.shares.find(
        (share) => share.userId === userId,
      );

      if (!userShare) {
        return total;
      }

      return total + userShare.shareAmount;
    }, 0);

    // Calculer le reste à vivre après toutes les participations
    const remainingAfterAllGroups = monthlyCapacity - totalGroupContributions;

    return {
      monthlyCapacity,
      totalGroupContributions,
      remainingAfterAllGroups,
      isNegative: remainingAfterAllGroups < 0,
    };
  },
);

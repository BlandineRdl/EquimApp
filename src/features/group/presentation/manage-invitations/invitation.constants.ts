/**
 * Invitation Feature Constants
 * Messages and labels for invitation-related screens
 */

export const INVITATION_MESSAGES = {
  INVALID_TOKEN: {
    title: "Erreur",
    message: "Lien d'invitation invalide",
  },
  FETCH_ERROR: {
    title: "Erreur",
    message: "Impossible de récupérer les détails de l'invitation",
  },
  INVALID_INCOME: {
    title: "Erreur",
    message: "Veuillez saisir un revenu mensuel valide",
  },
  SUCCESS: {
    title: "Succès",
    message: "Vous avez rejoint le groupe avec succès !",
    buttonText: "OK",
  },
  REFUSE_CONFIRMATION: {
    title: "Refuser l'invitation",
    message: "Êtes-vous sûr de vouloir refuser cette invitation ?",
    cancelText: "Annuler",
    confirmText: "Refuser",
  },
  NOT_FOUND: "Invitation introuvable",
} as const;

export const INVITATION_BACKGROUND_COLOR = "#fff";

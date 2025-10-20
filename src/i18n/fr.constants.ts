// French text constants
// TODO: Replace with proper i18n solution (react-i18next or similar) when adding multi-language support

export const AUTH_TEXT = {
  SIGN_IN: {
    WELCOME_TITLE: "Bienvenue sur Equim",
    WELCOME_SUBTITLE:
      "Partagez équitablement vos dépenses en fonction de vos revenus",
    EMAIL_LABEL: "Adresse email",
    EMAIL_PLACEHOLDER: "vous@exemple.com",
    CONTINUE_BUTTON: "Continuer →",
    LEGAL_TEXT:
      "En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.",
    SECURE_INFO_TITLE: "🔒 Connexion sécurisée",
    SECURE_INFO_TEXT:
      "Pas de mot de passe à retenir ! Nous vous enverrons un code à 6 chiffres pour vous connecter en toute sécurité.",
    RATE_LIMIT_ERROR:
      "Trop de tentatives. Veuillez réessayer dans {seconds} secondes.",
  },
  OTP: {
    TITLE: "Entrez le code",
    SUBTITLE: "Nous avons envoyé un code à 6 chiffres à",
    CODE_LABEL: "Code de vérification",
    CODE_PLACEHOLDER: "000000",
    VERIFY_BUTTON: "Vérifier",
    CHANGE_EMAIL_BUTTON: "← Modifier l'email",
    NO_CODE_TITLE: "💡 Code non reçu ?",
    NO_CODE_TEXT:
      "Vérifiez vos spams ou attendez quelques secondes. Le code expire après 5 minutes.",
    RESEND_BUTTON: "Renvoyer le code",
    RESEND_BUTTON_TIMER: "Renvoyer le code ({seconds}s)",
  },
} as const;

export const PROFILE_TEXT = {
  TITLE: "Mon profil",
  PSEUDO_LABEL: "Pseudo",
  INCOME_LABEL: "Revenu mensuel",
  INCOME_HINT: "Utilisé pour le calcul équitable des parts",
  PERSONAL_EXPENSES_LABEL: "Charges personnelles",
  NO_EXPENSES: "Aucune charge définie",
  EXPENSES_TOTAL_LABEL: "Total",
  CAPACITY_LABEL: "💰 Capacité de dépense",
  CAPACITY_HINT: "Revenu ({income} €) - Charges ({expenses} €)",
  INFO_TITLE: "À propos du revenu",
  INFO_TEXT_1:
    "Votre revenu mensuel est utilisé pour calculer votre part équitable dans chaque groupe. Plus votre revenu est élevé, plus votre contribution est importante.",
  INFO_TEXT_2:
    "Vous pouvez modifier votre revenu à tout moment. Les parts de tous vos groupes seront automatiquement recalculées.",
  LOGOUT_BUTTON: "Se déconnecter",
  LOADING: "Chargement...",
} as const;

export const COMMON_TEXT = {
  LOADING: "Chargement...",
  ERROR: "Erreur",
  SUCCESS: "Succès",
  CANCEL: "Annuler",
  CONFIRM: "Confirmer",
  SAVE: "Enregistrer",
  DELETE: "Supprimer",
  EDIT: "Modifier",
  ADD: "Ajouter",
  BACK: "Retour",
} as const;

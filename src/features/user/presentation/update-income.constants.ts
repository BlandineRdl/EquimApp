export const UPDATE_INCOME_MESSAGES = {
  EMPTY_INCOME: {
    type: "error" as const,
    text1: "Erreur",
    text2: "Veuillez entrer un revenu",
  },
  INVALID_NUMBER: {
    type: "error" as const,
    text1: "Erreur",
    text2: "Le revenu doit être un nombre valide",
  },
  VALIDATION_FAILED: (errors: string) => ({
    type: "error" as const,
    text1: "Validation échouée",
    text2: errors,
  }),
} as const;

export const UPDATE_INCOME_LABELS = {
  MODAL_TITLE: "Modifier mon revenu",
  FIELD_LABEL: "Revenu mensuel net (€)",
  FIELD_HINT_PREFIX: "Entre",
  FIELD_HINT_SUFFIX: "€ et",
  FIELD_PLACEHOLDER: "Ex: 2500",
  CANCEL_BUTTON: "Annuler",
  SAVE_BUTTON: "Enregistrer",
  SAVING_TEXT: "Enregistrement...",
  INVALID_VALUE: "Valeur invalide",
} as const;

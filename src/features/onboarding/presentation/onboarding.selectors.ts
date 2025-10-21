import { createSelector } from "@reduxjs/toolkit";
import type { AppState } from "../../../store/appState";

const selectOnboardingState = (state: AppState) => state.onboarding;

export const selectOnboardingUI = createSelector(
  [selectOnboardingState],
  (onboarding) => {
    const { pseudo, pseudoBlurred } = onboarding;

    const trimmedPseudo = pseudo.trim();

    // Validation
    let validationError = null;
    if (!trimmedPseudo) {
      validationError = "Le pseudo ne peut pas être vide";
    } else if (trimmedPseudo.length < 2) {
      validationError = "Le pseudo doit contenir au moins 2 caractères";
    } else if (trimmedPseudo.length > 20) {
      validationError = "Le pseudo ne peut pas dépasser 20 caractères";
    }

    return {
      pseudo,
      error: pseudoBlurred ? validationError : null,
      canContinue: !validationError,
      hasError: pseudoBlurred && !!validationError,
    };
  },
);

export const selectIncomeUI = createSelector(
  [selectOnboardingState],
  (onboarding) => {
    const { monthlyIncome, incomeBlurred } = onboarding;
    const numericIncome = parseFloat(monthlyIncome);

    let validationError = null;

    if (!monthlyIncome.trim()) {
      validationError = "Le revenu est requis";
    } else if (Number.isNaN(numericIncome)) {
      validationError = "Veuillez entrer un montant valide";
    } else if (numericIncome <= 0) {
      validationError = "Le revenu doit être supérieur à 0";
    } else if (numericIncome > 100000) {
      validationError = "Le revenu semble trop élevé";
    }

    return {
      monthlyIncome,
      error: incomeBlurred ? validationError : null,
      canContinue: !validationError,
      hasError: incomeBlurred && !!validationError,
      numericValue: Number.isNaN(numericIncome) ? 0 : numericIncome,
    };
  },
);

export const selectGroupUI = createSelector(
  [selectOnboardingState],
  (onboarding) => {
    const { groupName, groupNameBlurred } = onboarding;
    const trimmedName = groupName.trim();

    let validationError = null;

    if (!trimmedName) {
      validationError = "Le nom du groupe est requis";
    } else if (trimmedName.length < 2) {
      validationError = "Le nom doit contenir au moins 2 caractères";
    } else if (trimmedName.length > 30) {
      validationError = "Le nom ne peut pas dépasser 30 caractères";
    }

    return {
      groupName,
      error: groupNameBlurred ? validationError : null,
      canContinue: !validationError,
      hasError: groupNameBlurred && !!validationError,
    };
  },
);

export const selectExpensesUI = createSelector(
  [selectOnboardingState],
  (onboarding) => {
    const { expenses, groupName } = onboarding;

    // Calcul du total
    const totalAmount = expenses.reduce((sum, expense) => {
      const amount = parseFloat(expense.amount) || 0;
      return sum + amount;
    }, 0);

    // Vérification si au moins une dépense est remplie
    const hasAnyExpense = expenses.some(
      (expense) => expense.amount.trim() !== "",
    );

    return {
      expenses,
      groupName,
      totalAmount,
      hasAnyExpense,
      canContinue: hasAnyExpense, // Au moins une dépense pour continuer
      canSkip: true, // Toujours possible de passer cette étape
    };
  },
);

export const selectOnboardingSummary = createSelector(
  [selectOnboardingState],
  (onboarding) => {
    const { pseudo, monthlyIncome, groupName, expenses, skipGroupCreation } =
      onboarding;

    // Calculer le total des dépenses
    const totalExpenses = expenses.reduce((sum, expense) => {
      const amount = parseFloat(expense.amount) || 0;
      return sum + amount;
    }, 0);

    // Compter les dépenses configurées
    const expensesCount = expenses.filter(
      (expense) => expense.amount.trim() !== "",
    ).length;

    // Vérifier si tout est prêt pour la création
    // Group name is only required if user didn't skip group creation
    const isComplete =
      pseudo.trim() !== "" &&
      parseFloat(monthlyIncome) > 0 &&
      (skipGroupCreation || groupName.trim() !== "");

    return {
      pseudo,
      monthlyIncome: parseFloat(monthlyIncome) || 0,
      groupName,
      expensesCount,
      totalExpenses,
      isComplete,
      skipGroupCreation,
      expenses: expenses.filter((expense) => expense.amount.trim() !== ""),
    };
  },
);

export const selectOnboardingProgressByRoute = createSelector(
  [(_, currentPath) => currentPath],
  (currentPath) => {
    // Définition centralisée des étapes (ordre = progression)
    const steps = [
      { path: "/", label: "pseudo" },
      { path: "/onboarding/income", label: "income" },
      { path: "/onboarding/personal-expenses", label: "personal-expenses" },
      { path: "/onboarding/group-choice", label: "group-choice" },
      { path: "/onboarding/create-group", label: "group" },
      { path: "/onboarding/expenses", label: "expenses" },
      { path: "/onboarding/summary", label: "summary" },
    ];

    // Trouver l'index exact de l'étape courante
    let currentStepIndex = steps.findIndex((step) => step.path === currentPath);

    // Si aucun match → fallback sur la première étape
    if (currentStepIndex === -1) {
      currentStepIndex = 0;
    }

    const totalSteps = steps.length;
    let progressPercentage = Math.round(
      ((currentStepIndex + 1) / totalSteps) * 100,
    );

    // UX : éviter 0%, on commence par ex. à 20% dès la première étape
    if (currentStepIndex === 0 && progressPercentage < 20) {
      progressPercentage = 20;
    }

    return {
      currentStep: currentStepIndex + 1, // en base 1
      totalSteps,
      progressPercentage,
      currentLabel: steps[currentStepIndex].label,
    };
  },
);

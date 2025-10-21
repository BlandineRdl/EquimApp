// src/features/onboarding/usecases/completeOnboarding.usecase.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import Toast from "react-native-toast-message";
import { logger } from "../../../../lib/logger";
import type { AppState } from "../../../../store/appState";
import type { UserGateway } from "../../../user/ports/UserGateway";
import type {
  CompleteOnboardingResult,
  OnboardingGateway,
} from "../../ports/OnboardingGateway";

export const completeOnboarding = createAsyncThunk<
  CompleteOnboardingResult & { profile: { pseudo: string; income: number } },
  void,
  {
    state: AppState;
    extra: { onboardingGateway: OnboardingGateway; userGateway: UserGateway };
  }
>(
  "onboarding/complete",
  async (_, { getState, extra: { onboardingGateway, userGateway } }) => {
    const state = getState();
    const onboarding = state.onboarding;

    const filteredExpenses = onboarding.expenses.filter(
      (expense) => parseFloat(expense.amount) > 0,
    );

    // Prepare input using domain vocabulary
    // Group creation is optional based on skipGroupCreation flag
    const onboardingInput = {
      pseudo: onboarding.pseudo.trim(),
      income: parseFloat(onboarding.monthlyIncome) || 0,
      groupName: onboarding.skipGroupCreation
        ? undefined
        : onboarding.groupName.trim(),
      expenses: onboarding.skipGroupCreation
        ? []
        : filteredExpenses.map((expense) => ({
            label: expense.label, // ✅ Domain vocabulary
            amount: parseFloat(expense.amount),
            isPredefined: !expense.isCustom,
          })),
    };

    const result = await onboardingGateway.completeOnboarding(onboardingInput);

    // Create personal expenses if any were added during onboarding
    logger.debug("[completeOnboarding] Personal expenses to create", {
      count: onboarding.personalExpenses.length,
      expenses: onboarding.personalExpenses,
    });

    if (onboarding.personalExpenses.length > 0) {
      logger.info(
        "[completeOnboarding] Creating personal expenses after profile creation",
      );
      let failedExpenses = 0;
      for (const expense of onboarding.personalExpenses) {
        try {
          await userGateway.addPersonalExpense(result.profileId, {
            label: expense.label,
            amount: expense.amount,
          });
          logger.debug("[completeOnboarding] Created expense", {
            label: expense.label,
            amount: expense.amount,
          });
        } catch (error) {
          logger.error(
            "[completeOnboarding] Failed to create personal expense",
            error,
            { expense },
          );
          failedExpenses++;
        }
      }

      if (failedExpenses > 0) {
        // Show warning to user that some expenses failed
        Toast.show({
          type: "error",
          text1: "Charges personnelles incomplètes",
          text2: `${failedExpenses} charge(s) n'ont pas pu être ajoutées. Vous pouvez les ajouter depuis votre profil.`,
          position: "bottom",
          visibilityTime: 5000,
        });
      }
      logger.info("[completeOnboarding] Personal expenses creation completed", {
        total: onboarding.personalExpenses.length,
        failed: failedExpenses,
      });
    }

    // Add profile data to the result for the user slice
    return {
      ...result,
      profile: {
        pseudo: onboarding.pseudo.trim(),
        income: parseFloat(onboarding.monthlyIncome) || 0,
      },
    };
  },
);

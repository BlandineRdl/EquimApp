import { createListenerMiddleware } from "@reduxjs/toolkit";
import Toast from "react-native-toast-message";
import type { AppState } from "../../../store/appState";
import { completeOnboarding } from "../usecases/complete-onboarding/completeOnboarding.usecase";

export const onboardingListeners = createListenerMiddleware<AppState>();

// Show warning toast when some personal expenses failed during onboarding
onboardingListeners.startListening({
  actionCreator: completeOnboarding.fulfilled,
  effect: async (action) => {
    const failedCount = action.payload.failedPersonalExpenses;

    if (failedCount && failedCount > 0) {
      Toast.show({
        type: "error",
        text1: "Charges personnelles incomplètes",
        text2: `${failedCount} charge(s) n'ont pas pu être ajoutées. Vous pouvez les ajouter depuis votre profil.`,
        position: "bottom",
        visibilityTime: 5000,
      });
    }
  },
});

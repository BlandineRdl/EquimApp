// src/features/notification/store/notification.listeners.ts
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import Toast from "react-native-toast-message";
import { addMemberToGroup } from "../../group/usecases/add-member/addMember.usecase";
import { completeOnboarding } from "../../onboarding/usecases/complete-onboarding/completeOnboarding.usecase";
import {
  TOAST_TIMEOUT_DEFAULT,
  TOAST_TIMEOUT_ERROR,
  TOAST_TOP_OFFSET,
} from "../domain/notification.constants";
import { addNotification } from "./notification.slice";

function getToastTitle(type: "success" | "error" | "info"): string {
  switch (type) {
    case "success":
      return "Succès";
    case "error":
      return "Erreur";
    case "info":
      return "Information";
    default:
      return "";
  }
}

export const notificationListeners = createListenerMiddleware();

// 1) Listener générique : afficher un toast dès qu'une notification est ajoutée
notificationListeners.startListening({
  actionCreator: addNotification,
  effect: async (action) => {
    const { type, message } = action.payload;

    Toast.show({
      type,
      text1: getToastTitle(type),
      text2: message,
      visibilityTime:
        type === "error" ? TOAST_TIMEOUT_ERROR : TOAST_TIMEOUT_DEFAULT,
      autoHide: true,
      topOffset: TOAST_TOP_OFFSET,
    });
  },
});

// 2) Listeners spécifiques pour les succès
notificationListeners.startListening({
  matcher: isAnyOf(addMemberToGroup.fulfilled),
  effect: async (_, { dispatch }) => {
    dispatch(
      addNotification({
        type: "success",
        message: "Membre ajouté avec succès au groupe",
      }),
    );
  },
});

notificationListeners.startListening({
  matcher: isAnyOf(completeOnboarding.fulfilled),
  effect: async (_, { dispatch }) => {
    dispatch(
      addNotification({
        type: "success",
        message: "Compte créé avec succès !",
      }),
    );
  },
});

// 3) Listeners spécifiques pour les erreurs
notificationListeners.startListening({
  matcher: isAnyOf(addMemberToGroup.rejected, completeOnboarding.rejected),
  effect: async (action, { dispatch }) => {
    const message =
      (action.error &&
      typeof action.error === "object" &&
      "message" in action.error
        ? action.error.message
        : null) ||
      (typeof action.payload === "string" ? action.payload : null) ||
      "Une erreur est survenue";

    dispatch(
      addNotification({
        type: "error",
        message:
          typeof message === "string" ? message : "Une erreur est survenue",
      }),
    );
  },
});

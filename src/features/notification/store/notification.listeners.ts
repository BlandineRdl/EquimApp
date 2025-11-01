// src/features/notification/store/notification.listeners.ts
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import Toast from "react-native-toast-message";
import type { AppError } from "../../../types/thunk.types";
import { addMemberToGroup } from "../../group/usecases/add-member/addMember.usecase";
import { deleteGroup } from "../../group/usecases/delete-group/deleteGroup.usecase";
import { addExpenseToGroup } from "../../group/usecases/expense/addExpense.usecase";
import { deleteExpense } from "../../group/usecases/expense/deleteExpense.usecase";
import { updateExpense } from "../../group/usecases/expense/updateExpense.usecase";
import { generateInviteLink } from "../../group/usecases/invitation/generateInviteLink.usecase";
import { leaveGroup } from "../../group/usecases/leave-group/leaveGroup.usecase";
import { removeMemberFromGroup } from "../../group/usecases/remove-member/removeMember.usecase";
import { updatePhantomMember } from "../../group/usecases/update-phantom-member/updatePhantomMember.usecase";
import { completeOnboarding } from "../../onboarding/usecases/complete-onboarding/completeOnboarding.usecase";
import { addPersonalExpense } from "../../user/usecases/addPersonalExpense.usecase";
import { deletePersonalExpense } from "../../user/usecases/deletePersonalExpense.usecase";
import { updatePersonalExpense } from "../../user/usecases/updatePersonalExpense.usecase";
import { updateUserIncome } from "../../user/usecases/updateUserIncome.usecase";
import {
  TOAST_TIMEOUT_DEFAULT,
  TOAST_TIMEOUT_ERROR,
  TOAST_TOP_OFFSET,
} from "../presentation/toast/toast.constants";
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
    const { type, title, message } = action.payload;

    Toast.show({
      type,
      text1: title || getToastTitle(type), // Use custom title if provided, otherwise use default
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
        title: "Membre ajouté",
        message: "Le membre a été ajouté avec succès au groupe",
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
        title: "Bienvenue !",
        message: "Votre compte a été créé avec succès",
      }),
    );
  },
});

notificationListeners.startListening({
  matcher: isAnyOf(deleteGroup.fulfilled),
  effect: async (_, { dispatch }) => {
    dispatch(
      addNotification({
        type: "success",
        title: "Groupe supprimé",
        message: "Le groupe a été supprimé avec succès",
      }),
    );
  },
});

notificationListeners.startListening({
  matcher: isAnyOf(removeMemberFromGroup.fulfilled),
  effect: async (_, { dispatch }) => {
    dispatch(
      addNotification({
        type: "success",
        title: "Membre supprimé",
        message: "Le membre a été supprimé du groupe",
      }),
    );
  },
});

notificationListeners.startListening({
  matcher: isAnyOf(updatePhantomMember.fulfilled),
  effect: async (_, { dispatch }) => {
    dispatch(
      addNotification({
        type: "success",
        title: "Membre modifié",
        message: "Les informations du membre ont été mises à jour",
      }),
    );
  },
});

notificationListeners.startListening({
  matcher: isAnyOf(addExpenseToGroup.fulfilled),
  effect: async (_, { dispatch }) => {
    dispatch(
      addNotification({
        type: "success",
        title: "Dépense ajoutée",
        message: "La dépense a été ajoutée au groupe",
      }),
    );
  },
});

notificationListeners.startListening({
  matcher: isAnyOf(updateExpense.fulfilled),
  effect: async (_, { dispatch }) => {
    dispatch(
      addNotification({
        type: "success",
        title: "Dépense modifiée",
        message: "La dépense a été mise à jour",
      }),
    );
  },
});

notificationListeners.startListening({
  matcher: isAnyOf(deleteExpense.fulfilled),
  effect: async (_, { dispatch }) => {
    dispatch(
      addNotification({
        type: "success",
        title: "Dépense supprimée",
        message: "La dépense a été supprimée du groupe",
      }),
    );
  },
});

notificationListeners.startListening({
  matcher: isAnyOf(generateInviteLink.fulfilled),
  effect: async (_, { dispatch }) => {
    dispatch(
      addNotification({
        type: "success",
        title: "Lien créé",
        message: "Le lien d'invitation a été généré avec succès",
      }),
    );
  },
});

notificationListeners.startListening({
  matcher: isAnyOf(leaveGroup.fulfilled),
  effect: async (_, { dispatch }) => {
    dispatch(
      addNotification({
        type: "success",
        title: "Groupe quitté",
        message: "Vous avez quitté le groupe avec succès",
      }),
    );
  },
});

notificationListeners.startListening({
  matcher: isAnyOf(updateUserIncome.fulfilled),
  effect: async (action, { dispatch }) => {
    const payload = action.payload as { income: number };
    dispatch(
      addNotification({
        type: "success",
        title: "Revenu mis à jour",
        message: `Votre revenu a été mis à jour à ${payload.income.toLocaleString("fr-FR")}€`,
      }),
    );
  },
});

notificationListeners.startListening({
  matcher: isAnyOf(addPersonalExpense.fulfilled),
  effect: async (_, { dispatch }) => {
    dispatch(
      addNotification({
        type: "success",
        title: "Dépense ajoutée",
        message: "La dépense a été ajoutée avec succès",
      }),
    );
  },
});

notificationListeners.startListening({
  matcher: isAnyOf(updatePersonalExpense.fulfilled),
  effect: async (_, { dispatch }) => {
    dispatch(
      addNotification({
        type: "success",
        title: "Dépense modifiée",
        message: "La dépense a été mise à jour",
      }),
    );
  },
});

notificationListeners.startListening({
  matcher: isAnyOf(deletePersonalExpense.fulfilled),
  effect: async (_, { dispatch }) => {
    dispatch(
      addNotification({
        type: "success",
        title: "Dépense supprimée",
        message: "La dépense a été supprimée avec succès",
      }),
    );
  },
});

// 3) Listeners spécifiques pour les erreurs
notificationListeners.startListening({
  matcher: isAnyOf(
    addMemberToGroup.rejected,
    completeOnboarding.rejected,
    generateInviteLink.rejected,
    leaveGroup.rejected,
    updateUserIncome.rejected,
    deleteExpense.rejected,
    updateExpense.rejected,
    addExpenseToGroup.rejected,
    updatePhantomMember.rejected,
    deleteGroup.rejected,
    removeMemberFromGroup.rejected,
    addPersonalExpense.rejected,
    updatePersonalExpense.rejected,
    deletePersonalExpense.rejected,
  ),
  effect: async (action, { dispatch }) => {
    // With the new event-driven pattern, errors are in action.payload as AppError
    const errorPayload = action.payload as AppError | undefined;
    const fallbackError = action.error as { message?: string } | undefined;
    const message =
      errorPayload?.message ||
      fallbackError?.message ||
      "Une erreur est survenue";

    dispatch(
      addNotification({
        type: "error",
        message,
      }),
    );
  },
});

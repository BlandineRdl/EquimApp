import { createListenerMiddleware } from "@reduxjs/toolkit";
import { logger } from "../../../lib/logger";
import type { AppState } from "../../../store/appState";
import { groupGatewayInstance } from "../infra/groupGatewayInstance";
import { loadGroupById } from "../usecases/load-group/loadGroup.usecase";

export const groupListeners = createListenerMiddleware<AppState>();

// Map to store unsubscribe functions by groupId
const subscriptions = new Map<string, () => void>();

// Subscribe to realtime updates when a group is loaded
groupListeners.startListening({
  actionCreator: loadGroupById.fulfilled,
  effect: async (action, { dispatch }) => {
    const groupId = action.meta.arg;

    // Unsubscribe from previous subscription if exists
    if (subscriptions.has(groupId)) {
      logger.debug("[GroupListeners] Replacing existing subscription", {
        groupId,
      });
      subscriptions.get(groupId)?.();
      subscriptions.delete(groupId);
    }

    logger.info("[GroupListeners] Subscribing to group updates", { groupId });

    const unsubscribe = groupGatewayInstance.subscribe(groupId, {
      onMemberAdded: (member) => {
        logger.info("[Realtime] Member added", { pseudo: member.pseudo });
        // Reload group to get updated shares
        dispatch(loadGroupById(groupId));
      },
      onMemberRemoved: (memberId) => {
        logger.info("[Realtime] Member removed", { memberId });
        // Reload group to get updated shares
        dispatch(loadGroupById(groupId));
      },
      onExpenseAdded: (expense) => {
        logger.info("[Realtime] Expense added", { name: expense.name });
        // Reload group to get updated expenses and shares
        dispatch(loadGroupById(groupId));
      },
      onExpenseUpdated: (expense) => {
        logger.info("[Realtime] Expense updated", { name: expense.name });
        // Reload group to get updated expenses and shares
        dispatch(loadGroupById(groupId));
      },
      onExpenseDeleted: (expenseId) => {
        logger.info("[Realtime] Expense deleted", { expenseId });
        // Reload group to get updated expenses and shares
        dispatch(loadGroupById(groupId));
      },
    });

    // Store unsubscribe function
    subscriptions.set(groupId, unsubscribe);
  },
});

// Cleanup: unsubscribe when leaving a group (optional)
// You can add a cleanup action and listener here if needed

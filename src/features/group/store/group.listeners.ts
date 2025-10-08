import { createListenerMiddleware } from "@reduxjs/toolkit";
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
      console.log("🔄 [GroupListeners] Replacing existing subscription for group:", groupId);
      subscriptions.get(groupId)?.();
      subscriptions.delete(groupId);
    }

    console.log("🔔 [GroupListeners] Subscribing to group updates:", groupId);

    const unsubscribe = groupGatewayInstance.subscribe(groupId, {
      onMemberAdded: (member) => {
        console.log("✅ [Realtime] Member added:", member.pseudo);
        // Reload group to get updated shares
        dispatch(loadGroupById(groupId));
      },
      onMemberRemoved: (memberId) => {
        console.log("❌ [Realtime] Member removed:", memberId);
        // Reload group to get updated shares
        dispatch(loadGroupById(groupId));
      },
      onExpenseAdded: (expense) => {
        console.log("💰 [Realtime] Expense added:", expense.name);
        // Reload group to get updated expenses and shares
        dispatch(loadGroupById(groupId));
      },
      onExpenseUpdated: (expense) => {
        console.log("📝 [Realtime] Expense updated:", expense.name);
        // Reload group to get updated expenses and shares
        dispatch(loadGroupById(groupId));
      },
      onExpenseDeleted: (expenseId) => {
        console.log("🗑️ [Realtime] Expense deleted:", expenseId);
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

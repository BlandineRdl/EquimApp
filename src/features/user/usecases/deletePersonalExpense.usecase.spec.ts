/**
 * Feature: Supprimer une dépense personnelle
 * En tant qu'utilisateur authentifié,
 * Je veux supprimer une dépense,
 * Afin de voir ma capacité restante recalculée.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../store/buildReduxStore";
import { InMemoryAuthGateway } from "../../auth/infra/InMemoryAuthGateway";
import { initSession } from "../../auth/usecases/manage-session/initSession.usecase";
import { InMemoryUserGateway } from "../infra/InMemoryUserGateway";
import { addPersonalExpense } from "./addPersonalExpense.usecase";
import { deletePersonalExpense } from "./deletePersonalExpense.usecase";
import { loadUserProfile } from "./loadUserProfile.usecase";

describe("Feature: Supprimer une dépense personnelle", () => {
  let store: ReduxStore;
  let userGateway: InMemoryUserGateway;
  let authGateway: InMemoryAuthGateway;
  const testEmail = "test@example.com";
  let userId: string;

  beforeEach(async () => {
    userGateway = new InMemoryUserGateway();
    authGateway = new InMemoryAuthGateway();
    store = initReduxStore({ userGateway, authGateway });

    // Setup authenticated user session using verifyOtp
    const session = await authGateway.verifyOtp(testEmail, "123456");
    userId = session.user.id;
    await store.dispatch(initSession());

    // Setup initial profile data
    await userGateway.createProfile({
      id: userId,
      pseudo: "Test User",
      monthlyIncome: 2000,
      currency: "EUR",
      shareRevenue: true,
    });

    // Load the profile into Redux state
    await store.dispatch(loadUserProfile());
  });

  it("should delete expense and recalculate capacity", async () => {
    // Arrange - Add an expense
    await store.dispatch(
      addPersonalExpense({
        label: "Rent",
        amount: 800,
      }),
    );

    // Get the expense ID from state
    const stateBeforeDelete = store.getState();
    const expenseId = stateBeforeDelete.user.profile?.personalExpenses?.[0].id;
    if (!expenseId) {
      throw new Error("Expense ID not found");
    }

    // Act - Delete the expense
    await store.dispatch(deletePersonalExpense(expenseId));

    // Assert - Expense is removed and capacity recalculated
    const state = store.getState();
    expect(state.user.profile?.personalExpenses).toHaveLength(0);
    expect(state.user.profile?.capacity).toBe(2000);
  });

  it("should handle deleting one of multiple expenses", async () => {
    // Arrange - Add multiple expenses
    await store.dispatch(
      addPersonalExpense({
        label: "Rent",
        amount: 800,
      }),
    );

    await store.dispatch(
      addPersonalExpense({
        label: "Transport",
        amount: 100,
      }),
    );

    // Get the first expense ID
    const stateBeforeDelete = store.getState();
    const firstExpenseId =
      stateBeforeDelete.user.profile?.personalExpenses?.[0].id;
    if (!firstExpenseId) {
      throw new Error("Expense ID not found");
    }

    // Act - Delete the first expense
    await store.dispatch(deletePersonalExpense(firstExpenseId));

    // Assert - First expense removed, second remains
    const state = store.getState();
    expect(state.user.profile?.personalExpenses).toHaveLength(1);
    expect(state.user.profile?.personalExpenses?.[0].label).toBe("Transport");
    expect(state.user.profile?.capacity).toBe(1900); // 2000 - 100
  });
});

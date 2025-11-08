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

    const session = await authGateway.verifyOtp(testEmail, "123456");
    userId = session.user.id;
    await store.dispatch(initSession());

    await userGateway.createProfile({
      id: userId,
      pseudo: "Test User",
      monthlyIncome: 2000,
      currency: "EUR",
      shareRevenue: true,
    });

    await store.dispatch(loadUserProfile());
  });

  it("should delete expense and recalculate capacity", async () => {
    await store.dispatch(
      addPersonalExpense({
        label: "Rent",
        amount: 800,
      }),
    );

    const stateBeforeDelete = store.getState();
    const expenseId = stateBeforeDelete.user.profile?.personalExpenses?.[0].id;
    if (!expenseId) {
      throw new Error("Expense ID not found");
    }

    await store.dispatch(deletePersonalExpense(expenseId));

    const state = store.getState();
    expect(state.user.profile?.personalExpenses).toHaveLength(0);
    expect(state.user.profile?.capacity).toBe(2000);
  });

  it("should handle deleting one of multiple expenses", async () => {
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

    const stateBeforeDelete = store.getState();
    const firstExpenseId =
      stateBeforeDelete.user.profile?.personalExpenses?.[0].id;
    if (!firstExpenseId) {
      throw new Error("Expense ID not found");
    }

    await store.dispatch(deletePersonalExpense(firstExpenseId));

    const state = store.getState();
    expect(state.user.profile?.personalExpenses).toHaveLength(1);
    expect(state.user.profile?.personalExpenses?.[0].label).toBe("Transport");
    expect(state.user.profile?.capacity).toBe(1900);
  });
});

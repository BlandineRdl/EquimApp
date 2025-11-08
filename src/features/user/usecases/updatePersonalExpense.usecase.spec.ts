import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../store/buildReduxStore";
import { InMemoryAuthGateway } from "../../auth/infra/InMemoryAuthGateway";
import { initSession } from "../../auth/usecases/manage-session/initSession.usecase";
import { InMemoryUserGateway } from "../infra/InMemoryUserGateway";
import { addPersonalExpense } from "./addPersonalExpense.usecase";
import { loadUserProfile } from "./loadUserProfile.usecase";
import { updatePersonalExpense } from "./updatePersonalExpense.usecase";

describe("Feature: Mettre à jour une dépense personnelle", () => {
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

  it("should update expense and recalculate capacity", async () => {
    await store.dispatch(
      addPersonalExpense({
        label: "Rent",
        amount: 800,
      }),
    );

    const stateBeforeUpdate = store.getState();
    const expenseId = stateBeforeUpdate.user.profile?.personalExpenses?.[0].id;
    if (!expenseId) {
      throw new Error("Expense ID not found");
    }

    await store.dispatch(
      updatePersonalExpense({
        id: expenseId,
        label: "Updated Rent",
        amount: 900,
      }),
    );

    const state = store.getState();
    expect(state.user.profile?.personalExpenses).toHaveLength(1);
    expect(state.user.profile?.personalExpenses?.[0].label).toBe(
      "Updated Rent",
    );
    expect(state.user.profile?.personalExpenses?.[0].amount).toBe(900);
    expect(state.user.profile?.capacity).toBe(1100);
  });

  it("should recalculate capacity when amount decreases", async () => {
    await store.dispatch(
      addPersonalExpense({
        label: "Rent",
        amount: 800,
      }),
    );

    const stateBeforeUpdate = store.getState();
    const expenseId = stateBeforeUpdate.user.profile?.personalExpenses?.[0].id;
    if (!expenseId) {
      throw new Error("Expense ID not found");
    }

    await store.dispatch(
      updatePersonalExpense({
        id: expenseId,
        label: "Rent",
        amount: 500,
      }),
    );

    const state = store.getState();
    expect(state.user.profile?.capacity).toBe(1500);
  });

  it("should handle updating one of multiple expenses", async () => {
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

    const stateBeforeUpdate = store.getState();
    const transportExpenseId =
      stateBeforeUpdate.user.profile?.personalExpenses?.[1].id;
    if (!transportExpenseId) {
      throw new Error("Transport expense ID not found");
    }

    await store.dispatch(
      updatePersonalExpense({
        id: transportExpenseId,
        label: "Public Transport",
        amount: 150,
      }),
    );

    const state = store.getState();
    const expenses = state.user.profile?.personalExpenses || [];
    expect(expenses).toHaveLength(2);
    expect(expenses[0].label).toBe("Rent");
    expect(expenses[0].amount).toBe(800);
    expect(expenses[1].label).toBe("Public Transport");
    expect(expenses[1].amount).toBe(150);
    expect(state.user.profile?.capacity).toBe(1050);
  });
});

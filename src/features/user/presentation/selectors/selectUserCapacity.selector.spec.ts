/**
 * View model generation for User Capacity
 * Tests capacity calculation through Redux store
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { ReduxStore } from "../../../../store/buildReduxStore";
import { initReduxStore } from "../../../../store/buildReduxStore";
import { InMemoryUserGateway } from "../../infra/InMemoryUserGateway";
import { selectHasPersonalExpenses } from "./selectHasPersonalExpenses.selector";
import { selectPersonalExpenses } from "./selectPersonalExpenses.selector";
import { selectUserCapacity } from "./selectUserCapacity.selector";

describe("View model generation for User Capacity", () => {
  let store: ReduxStore;
  let userGateway: InMemoryUserGateway;
  const userId = "test-user-123";

  beforeEach(async () => {
    userGateway = new InMemoryUserGateway();
    await userGateway.createProfile({
      id: userId,
      pseudo: "TestUser",
      monthlyIncome: 2000,
      currency: "EUR",
      shareRevenue: true,
    });

    store = initReduxStore({
      userGateway,
    }) as ReduxStore;

    // Simulate auth state
    store.dispatch({
      type: "auth/signIn/fulfilled",
      payload: { userId },
    });
  });

  it("should return undefined capacity when no profile loaded", () => {
    const capacity = selectUserCapacity(store.getState());

    expect(capacity).toBeUndefined();
  });

  it("should return capacity equal to income when no expenses", () => {
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [],
        capacity: 2000,
      },
    });

    const capacity = selectUserCapacity(store.getState());

    expect(capacity).toBe(2000);
  });

  it("should recalculate capacity when adding expense", () => {
    // Load profile
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [],
        capacity: 2000,
      },
    });

    // Add expense
    store.dispatch({
      type: "user/addPersonalExpense/fulfilled",
      payload: {
        id: "expense-1",
        userId,
        label: "Loyer",
        amount: 800,
      },
    });

    const capacity = selectUserCapacity(store.getState());

    expect(capacity).toBe(1200); // 2000 - 800
  });

  it("should recalculate capacity when updating expense", () => {
    // Load profile with expense
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [
          {
            id: "expense-1",
            userId,
            label: "Loyer",
            amount: 800,
          },
        ],
        capacity: 1200,
      },
    });

    // Update expense amount
    store.dispatch({
      type: "user/updatePersonalExpense/fulfilled",
      payload: {
        id: "expense-1",
        userId,
        label: "Loyer",
        amount: 900, // Increased by 100
      },
    });

    const capacity = selectUserCapacity(store.getState());

    expect(capacity).toBe(1100); // 2000 - 900
  });

  it("should recalculate capacity when deleting expense", () => {
    // Load profile with expenses
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [
          {
            id: "expense-1",
            userId,
            label: "Loyer",
            amount: 800,
          },
          {
            id: "expense-2",
            userId,
            label: "Transport",
            amount: 100,
          },
        ],
        capacity: 1100,
      },
    });

    // Delete expense
    store.dispatch({
      type: "user/deletePersonalExpense/fulfilled",
      payload: "expense-1", // Delete the 800€ expense
    });

    const capacity = selectUserCapacity(store.getState());

    expect(capacity).toBe(1900); // 2000 - 100
  });

  it("should update capacity when income changes", () => {
    // Load profile
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [
          {
            id: "expense-1",
            userId,
            label: "Loyer",
            amount: 800,
          },
        ],
        capacity: 1200,
      },
    });

    // Update income (optimistic update)
    store.dispatch({
      type: "user/updateIncome/pending",
      meta: {
        arg: {
          userId,
          newIncome: 2500,
        },
      },
    });

    const capacity = selectUserCapacity(store.getState());

    expect(capacity).toBe(1700); // 2500 - 800
  });

  it("should handle negative capacity", () => {
    // Load profile
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 1000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [
          {
            id: "expense-1",
            userId,
            label: "Loyer",
            amount: 1500,
          },
        ],
        capacity: -500,
      },
    });

    const capacity = selectUserCapacity(store.getState());

    expect(capacity).toBe(-500);
  });
});

describe("View model generation for Personal Expenses", () => {
  let store: ReduxStore;
  let userGateway: InMemoryUserGateway;
  const userId = "test-user-123";

  beforeEach(async () => {
    userGateway = new InMemoryUserGateway();
    await userGateway.createProfile({
      id: userId,
      pseudo: "TestUser",
      monthlyIncome: 2000,
      currency: "EUR",
      shareRevenue: true,
    });

    store = initReduxStore({
      userGateway,
    }) as ReduxStore;
  });

  it("should return empty array when no profile", () => {
    const expenses = selectPersonalExpenses(store.getState());

    expect(expenses).toEqual([]);
  });

  it("should return empty array when no expenses", () => {
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [],
        capacity: 2000,
      },
    });

    const expenses = selectPersonalExpenses(store.getState());

    expect(expenses).toEqual([]);
    expect(selectHasPersonalExpenses(store.getState())).toBe(false);
  });

  it("should return expenses list", () => {
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [
          { id: "1", userId, label: "Loyer", amount: 800 },
          { id: "2", userId, label: "Transport", amount: 100 },
        ],
        capacity: 1100,
      },
    });

    const expenses = selectPersonalExpenses(store.getState());

    expect(expenses).toHaveLength(2);
    expect(expenses[0].label).toBe("Loyer");
    expect(expenses[1].label).toBe("Transport");
    expect(selectHasPersonalExpenses(store.getState())).toBe(true);
  });

  it("should add expense to the list", () => {
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [],
        capacity: 2000,
      },
    });

    store.dispatch({
      type: "user/addPersonalExpense/fulfilled",
      payload: {
        id: "expense-1",
        userId,
        label: "Loyer",
        amount: 800,
      },
    });

    const expenses = selectPersonalExpenses(store.getState());

    expect(expenses).toHaveLength(1);
    expect(expenses[0]).toEqual({
      id: "expense-1",
      userId,
      label: "Loyer",
      amount: 800,
    });
    expect(selectHasPersonalExpenses(store.getState())).toBe(true);
  });

  it("should update expense in the list", () => {
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [
          { id: "expense-1", userId, label: "Loyer", amount: 800 },
        ],
        capacity: 1200,
      },
    });

    store.dispatch({
      type: "user/updatePersonalExpense/fulfilled",
      payload: {
        id: "expense-1",
        userId,
        label: "Nouveau Loyer",
        amount: 900,
      },
    });

    const expenses = selectPersonalExpenses(store.getState());

    expect(expenses).toHaveLength(1);
    expect(expenses[0].label).toBe("Nouveau Loyer");
    expect(expenses[0].amount).toBe(900);
  });

  it("should remove expense from the list", () => {
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [
          { id: "expense-1", userId, label: "Loyer", amount: 800 },
          { id: "expense-2", userId, label: "Transport", amount: 100 },
        ],
        capacity: 1100,
      },
    });

    store.dispatch({
      type: "user/deletePersonalExpense/fulfilled",
      payload: "expense-1",
    });

    const expenses = selectPersonalExpenses(store.getState());

    expect(expenses).toHaveLength(1);
    expect(expenses[0].id).toBe("expense-2");
    expect(selectHasPersonalExpenses(store.getState())).toBe(true);
  });

  it("should show hasPersonalExpenses as false after removing last expense", () => {
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [
          { id: "expense-1", userId, label: "Loyer", amount: 800 },
        ],
        capacity: 1200,
      },
    });

    store.dispatch({
      type: "user/deletePersonalExpense/fulfilled",
      payload: "expense-1",
    });

    expect(selectHasPersonalExpenses(store.getState())).toBe(false);
  });
});

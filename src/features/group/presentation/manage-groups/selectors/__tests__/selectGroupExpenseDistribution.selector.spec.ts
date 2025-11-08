import { beforeEach, describe, expect, it } from "vitest";
import type { ReduxStore } from "../../../../../../store/buildReduxStore";
import { initReduxStore } from "../../../../../../store/buildReduxStore";
import { InMemoryUserGateway } from "../../../../../user/infra/InMemoryUserGateway";
import { InMemoryGroupGateway } from "../../../../infra/inMemoryGroup.gateway";
import { selectGroupExpenseDistribution } from "../selectGroupExpenseDistribution.selector";

describe("View model generation for Group Expense Distribution", () => {
  let store: ReduxStore;
  let userGateway: InMemoryUserGateway;
  let groupGateway: InMemoryGroupGateway;
  const userId = "test-user-123";
  const groupId = "test-group-456";

  beforeEach(async () => {
    userGateway = new InMemoryUserGateway();
    groupGateway = new InMemoryGroupGateway();

    await userGateway.createProfile({
      id: userId,
      pseudo: "TestUser",
      monthlyIncome: 3000,
      currency: "EUR",
      shareRevenue: true,
    });

    store = initReduxStore({
      userGateway,
      groupGateway,
    }) as ReduxStore;

    store.dispatch({
      type: "auth/signIn/fulfilled",
      payload: { userId },
    });
  });

  it("should return empty distribution when no expenses", () => {
    store.dispatch({
      type: "groups/loadGroupById/fulfilled",
      payload: {
        id: groupId,
        name: "Foyer",
        currency: "EUR",
        creatorId: userId,
        members: [],
        expenses: [],
        shares: {
          totalExpenses: 0,
          shares: [],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    const result = selectGroupExpenseDistribution(store.getState(), groupId);

    expect(result).toEqual({
      expenseDistribution: [],
      totalExpenses: 0,
      expensesCount: 0,
    });
  });

  it("should calculate distribution for single expense", () => {
    store.dispatch({
      type: "groups/loadGroupById/fulfilled",
      payload: {
        id: groupId,
        name: "Foyer",
        currency: "EUR",
        creatorId: userId,
        members: [],
        expenses: [
          {
            id: "expense-1",
            groupId,
            name: "Loyer",
            amount: 1800,
            currency: "EUR",
            isPredefined: false,
            createdBy: userId,
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
          },
        ],
        shares: {
          totalExpenses: 1800,
          shares: [],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    const result = selectGroupExpenseDistribution(store.getState(), groupId);

    expect(result).toEqual({
      expenseDistribution: [
        {
          name: "Loyer",
          amount: 1800,
          percentage: 100,
        },
      ],
      totalExpenses: 1800,
      expensesCount: 1,
    });
  });

  it("should calculate distribution for multiple expenses", () => {
    store.dispatch({
      type: "groups/loadGroupById/fulfilled",
      payload: {
        id: groupId,
        name: "Foyer",
        currency: "EUR",
        creatorId: userId,
        members: [],
        expenses: [
          {
            id: "expense-1",
            groupId,
            name: "Loyer",
            amount: 1800,
            currency: "EUR",
            isPredefined: false,
            createdBy: userId,
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
          },
          {
            id: "expense-2",
            groupId,
            name: "Courses",
            amount: 450,
            currency: "EUR",
            isPredefined: false,
            createdBy: userId,
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
          },
          {
            id: "expense-3",
            groupId,
            name: "Électricité",
            amount: 200,
            currency: "EUR",
            isPredefined: false,
            createdBy: userId,
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
          },
        ],
        shares: {
          totalExpenses: 2450,
          shares: [],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    const result = selectGroupExpenseDistribution(store.getState(), groupId);

    expect(result.totalExpenses).toBe(2450);
    expect(result.expensesCount).toBe(3);
    expect(result.expenseDistribution).toEqual([
      {
        name: "Loyer",
        amount: 1800,
        percentage: 73,
      },
      {
        name: "Courses",
        amount: 450,
        percentage: 18,
      },
      {
        name: "Électricité",
        amount: 200,
        percentage: 8,
      },
    ]);
  });

  it("should handle equal expenses", () => {
    store.dispatch({
      type: "groups/loadGroupById/fulfilled",
      payload: {
        id: groupId,
        name: "Foyer",
        currency: "EUR",
        creatorId: userId,
        members: [],
        expenses: [
          {
            id: "expense-1",
            groupId,
            name: "Loyer",
            amount: 1000,
            currency: "EUR",
            isPredefined: false,
            createdBy: userId,
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
          },
          {
            id: "expense-2",
            groupId,
            name: "Courses",
            amount: 1000,
            currency: "EUR",
            isPredefined: false,
            createdBy: userId,
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
          },
        ],
        shares: {
          totalExpenses: 2000,
          shares: [],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    const result = selectGroupExpenseDistribution(store.getState(), groupId);

    expect(result.totalExpenses).toBe(2000);
    expect(result.expensesCount).toBe(2);
    expect(result.expenseDistribution).toEqual([
      {
        name: "Loyer",
        amount: 1000,
        percentage: 50,
      },
      {
        name: "Courses",
        amount: 1000,
        percentage: 50,
      },
    ]);
  });

  it("should update distribution when expense is added", () => {
    store.dispatch({
      type: "groups/loadGroupById/fulfilled",
      payload: {
        id: groupId,
        name: "Foyer",
        currency: "EUR",
        creatorId: userId,
        members: [],
        expenses: [
          {
            id: "expense-1",
            groupId,
            name: "Loyer",
            amount: 1800,
            currency: "EUR",
            isPredefined: false,
            createdBy: userId,
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
          },
        ],
        shares: {
          totalExpenses: 1800,
          shares: [],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    store.dispatch({
      type: "groups/addExpense/fulfilled",
      payload: {
        groupId,
        expense: {
          id: "expense-2",
          groupId,
          name: "Courses",
          amount: 650,
          currency: "EUR",
          isPredefined: false,
          createdBy: userId,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        },
        shares: {
          totalExpenses: 2450,
          shares: [],
        },
      },
    });

    const result = selectGroupExpenseDistribution(store.getState(), groupId);

    expect(result.totalExpenses).toBe(2450);
    expect(result.expensesCount).toBe(2);
    expect(result.expenseDistribution).toHaveLength(2);
    expect(result.expenseDistribution[0].name).toBe("Loyer");
    expect(result.expenseDistribution[0].percentage).toBe(73);
    expect(result.expenseDistribution[1].name).toBe("Courses");
    expect(result.expenseDistribution[1].percentage).toBe(27);
  });

  it("should update distribution when expense is deleted", () => {
    store.dispatch({
      type: "groups/loadGroupById/fulfilled",
      payload: {
        id: groupId,
        name: "Foyer",
        currency: "EUR",
        creatorId: userId,
        members: [],
        expenses: [
          {
            id: "expense-1",
            groupId,
            name: "Loyer",
            amount: 1800,
            currency: "EUR",
            isPredefined: false,
            createdBy: userId,
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
          },
          {
            id: "expense-2",
            groupId,
            name: "Courses",
            amount: 650,
            currency: "EUR",
            isPredefined: false,
            createdBy: userId,
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
          },
        ],
        shares: {
          totalExpenses: 2450,
          shares: [],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    store.dispatch({
      type: "groups/deleteExpense/fulfilled",
      payload: {
        groupId,
        expenseId: "expense-2",
        shares: {
          totalExpenses: 1800,
          shares: [],
        },
      },
    });

    const result = selectGroupExpenseDistribution(store.getState(), groupId);

    expect(result.totalExpenses).toBe(1800);
    expect(result.expensesCount).toBe(1);
    expect(result.expenseDistribution).toEqual([
      {
        name: "Loyer",
        amount: 1800,
        percentage: 100,
      },
    ]);
  });
});

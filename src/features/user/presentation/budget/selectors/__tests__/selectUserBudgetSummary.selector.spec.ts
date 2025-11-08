import { beforeEach, describe, expect, it } from "vitest";
import type { ReduxStore } from "../../../../../../store/buildReduxStore";
import { initReduxStore } from "../../../../../../store/buildReduxStore";
import { InMemoryGroupGateway } from "../../../../../group/infra/inMemoryGroup.gateway";
import { InMemoryUserGateway } from "../../../../infra/InMemoryUserGateway";
import { selectUserBudgetSummary } from "../selectUserBudgetSummary.selector";

describe("View model generation for User Budget Summary", () => {
  let store: ReduxStore;
  let userGateway: InMemoryUserGateway;
  let groupGateway: InMemoryGroupGateway;
  const userId = "test-user-123";

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

  it("should return null when no profile loaded", () => {
    const result = selectUserBudgetSummary(store.getState());

    expect(result).toBeNull();
  });

  it("should return budget summary with no groups", () => {
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 3000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [{ id: "1", userId, label: "Loyer", amount: 1300 }],
        capacity: 1700,
      },
    });

    const result = selectUserBudgetSummary(store.getState());

    expect(result).toEqual({
      income: 3000,
      capacity: 1700,
      groupShares: [],
      totalGroupContributions: 0,
      remainingBudget: 1700,
      expenseRatio: 0,
      isHealthy: true,
      hasGroups: false,
      hasValidCapacity: true,
    });
  });

  it("should calculate budget summary with one group", () => {
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 3000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [{ id: "1", userId, label: "Loyer", amount: 1300 }],
        capacity: 1700,
      },
    });

    store.dispatch({
      type: "groups/loadUserGroups/fulfilled",
      payload: [
        {
          id: "group-1",
          name: "Foyer",
          currency: "EUR",
          creatorId: userId,
          members: [],
          expenses: [],
          shares: {
            totalExpenses: 2000,
            shares: [
              {
                memberId: "member-1",
                userId,
                pseudo: "TestUser",
                sharePercentage: 50,
                shareAmount: 1000,
              },
            ],
          },
          totalMonthlyBudget: 2000,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        },
      ],
    });

    const result = selectUserBudgetSummary(store.getState());

    expect(result).toEqual({
      income: 3000,
      capacity: 1700,
      groupShares: [
        {
          groupId: "group-1",
          groupName: "Foyer",
          sharePercentage: 50,
          shareAmount: 1000,
        },
      ],
      totalGroupContributions: 1000,
      remainingBudget: 700,
      expenseRatio: 59,
      isHealthy: true,
      hasGroups: true,
      hasValidCapacity: true,
    });
  });

  it("should calculate budget summary with multiple groups", () => {
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 3000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [{ id: "1", userId, label: "Loyer", amount: 1000 }],
        capacity: 2000,
      },
    });

    store.dispatch({
      type: "groups/loadUserGroups/fulfilled",
      payload: [
        {
          id: "group-1",
          name: "Foyer",
          currency: "EUR",
          creatorId: userId,
          members: [],
          expenses: [],
          shares: {
            totalExpenses: 1500,
            shares: [
              {
                memberId: "member-1",
                userId,
                pseudo: "TestUser",
                sharePercentage: 60,
                shareAmount: 900,
              },
            ],
          },
          totalMonthlyBudget: 1500,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        },
        {
          id: "group-2",
          name: "Vacances",
          currency: "EUR",
          creatorId: userId,
          members: [],
          expenses: [],
          shares: {
            totalExpenses: 1000,
            shares: [
              {
                memberId: "member-2",
                userId,
                pseudo: "TestUser",
                sharePercentage: 40,
                shareAmount: 400,
              },
            ],
          },
          totalMonthlyBudget: 1000,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        },
      ],
    });

    const result = selectUserBudgetSummary(store.getState());

    expect(result).toEqual({
      income: 3000,
      capacity: 2000,
      groupShares: [
        {
          groupId: "group-1",
          groupName: "Foyer",
          sharePercentage: 60,
          shareAmount: 900,
        },
        {
          groupId: "group-2",
          groupName: "Vacances",
          sharePercentage: 40,
          shareAmount: 400,
        },
      ],
      totalGroupContributions: 1300,
      remainingBudget: 700,
      expenseRatio: 65,
      isHealthy: true,
      hasGroups: true,
      hasValidCapacity: true,
    });
  });

  it("should handle negative remaining budget (unhealthy)", () => {
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 3000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [{ id: "1", userId, label: "Loyer", amount: 2000 }],
        capacity: 1000,
      },
    });

    store.dispatch({
      type: "groups/loadUserGroups/fulfilled",
      payload: [
        {
          id: "group-1",
          name: "Foyer",
          currency: "EUR",
          creatorId: userId,
          members: [],
          expenses: [],
          shares: {
            totalExpenses: 2000,
            shares: [
              {
                memberId: "member-1",
                userId,
                pseudo: "TestUser",
                sharePercentage: 100,
                shareAmount: 1500,
              },
            ],
          },
          totalMonthlyBudget: 2000,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        },
      ],
    });

    const result = selectUserBudgetSummary(store.getState());

    expect(result?.isHealthy).toBe(false);
    expect(result?.remainingBudget).toBe(-500);
    expect(result?.expenseRatio).toBe(150);
  });

  it("should handle capacity = 0 (invalid capacity)", () => {
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 1000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [{ id: "1", userId, label: "Loyer", amount: 1000 }],
        capacity: 0,
      },
    });

    const result = selectUserBudgetSummary(store.getState());

    expect(result).toEqual({
      income: 1000,
      capacity: 0,
      groupShares: [],
      totalGroupContributions: 0,
      remainingBudget: 0,
      expenseRatio: 0,
      isHealthy: true,
      hasGroups: false,
      hasValidCapacity: false,
    });
  });

  it("should skip groups without user shares", () => {
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 3000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [],
        capacity: 3000,
      },
    });

    store.dispatch({
      type: "groups/loadUserGroups/fulfilled",
      payload: [
        {
          id: "group-1",
          name: "Foyer",
          currency: "EUR",
          creatorId: "other-user",
          members: [],
          expenses: [],
          shares: {
            totalExpenses: 2000,
            shares: [
              {
                memberId: "member-2",
                userId: "other-user",
                pseudo: "OtherUser",
                sharePercentage: 100,
                shareAmount: 2000,
              },
            ],
          },
          totalMonthlyBudget: 2000,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        },
      ],
    });

    const result = selectUserBudgetSummary(store.getState());

    expect(result?.groupShares).toEqual([]);
    expect(result?.totalGroupContributions).toBe(0);
    expect(result?.hasGroups).toBe(false);
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import type { ReduxStore } from "../../../../../../store/buildReduxStore";
import { initReduxStore } from "../../../../../../store/buildReduxStore";
import { InMemoryGroupGateway } from "../../../../../group/infra/inMemoryGroup.gateway";
import { InMemoryUserGateway } from "../../../../infra/InMemoryUserGateway";
import { selectUserRemainingCapacity } from "../selectUserRemainingCapacity.selector";

describe("selectUserRemainingCapacity", () => {
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

  it("should return null when user is not logged in", () => {
    store.dispatch({
      type: "auth/signOut/fulfilled",
      payload: undefined,
    });

    const result = selectUserRemainingCapacity(store.getState());
    expect(result).toBeNull();
  });

  it("should calculate remaining capacity with no groups", () => {
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        email: "test@example.com",
        monthlyIncome: 3000,
        capacity: 2800,
        currency: "EUR",
        shareRevenue: true,
        hasCompletedOnboarding: true,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    const result = selectUserRemainingCapacity(store.getState());

    expect(result).not.toBeNull();
    expect(result?.monthlyCapacity).toBe(2800);
    expect(result?.totalGroupContributions).toBe(0);
    expect(result?.remainingAfterAllGroups).toBe(2800);
    expect(result?.isNegative).toBe(false);
  });

  it("should calculate remaining capacity with one group", () => {
    const groupId = "group-1";

    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        email: "test@example.com",
        monthlyIncome: 3000,
        capacity: 2800,
        currency: "EUR",
        shareRevenue: true,
        hasCompletedOnboarding: true,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

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
          totalExpenses: 1000,
          shares: [
            {
              memberId: "member-1",
              userId,
              pseudo: "TestUser",
              sharePercentage: 100,
              shareAmount: 1000,
            },
          ],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    const result = selectUserRemainingCapacity(store.getState());

    expect(result).not.toBeNull();
    expect(result?.monthlyCapacity).toBe(2800);
    expect(result?.totalGroupContributions).toBe(1000);
    expect(result?.remainingAfterAllGroups).toBe(1800);
    expect(result?.isNegative).toBe(false);
  });

  it("should calculate remaining capacity with multiple groups", () => {
    const group1Id = "group-1";
    const group2Id = "group-2";

    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        email: "test@example.com",
        monthlyIncome: 3000,
        capacity: 2800,
        currency: "EUR",
        shareRevenue: true,
        hasCompletedOnboarding: true,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    store.dispatch({
      type: "groups/loadGroupById/fulfilled",
      payload: {
        id: group1Id,
        name: "Foyer",
        currency: "EUR",
        creatorId: userId,
        members: [],
        expenses: [],
        shares: {
          totalExpenses: 1000,
          shares: [
            {
              memberId: "member-1",
              userId,
              pseudo: "TestUser",
              sharePercentage: 100,
              shareAmount: 600,
            },
          ],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    store.dispatch({
      type: "groups/loadGroupById/fulfilled",
      payload: {
        id: group2Id,
        name: "Vacances",
        currency: "EUR",
        creatorId: userId,
        members: [],
        expenses: [],
        shares: {
          totalExpenses: 500,
          shares: [
            {
              memberId: "member-2",
              userId,
              pseudo: "TestUser",
              sharePercentage: 50,
              shareAmount: 250,
            },
          ],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    const result = selectUserRemainingCapacity(store.getState());

    expect(result).not.toBeNull();
    expect(result?.monthlyCapacity).toBe(2800);
    expect(result?.totalGroupContributions).toBe(850);
    expect(result?.remainingAfterAllGroups).toBe(1950);
    expect(result?.isNegative).toBe(false);
  });

  it("should detect negative remaining capacity", () => {
    const group1Id = "group-1";
    const group2Id = "group-2";

    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        email: "test@example.com",
        monthlyIncome: 2000,
        capacity: 1000,
        currency: "EUR",
        shareRevenue: true,
        hasCompletedOnboarding: true,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    store.dispatch({
      type: "groups/loadGroupById/fulfilled",
      payload: {
        id: group1Id,
        name: "Foyer",
        currency: "EUR",
        creatorId: userId,
        members: [],
        expenses: [],
        shares: {
          totalExpenses: 1200,
          shares: [
            {
              memberId: "member-1",
              userId,
              pseudo: "TestUser",
              sharePercentage: 100,
              shareAmount: 800,
            },
          ],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    store.dispatch({
      type: "groups/loadGroupById/fulfilled",
      payload: {
        id: group2Id,
        name: "Vacances",
        currency: "EUR",
        creatorId: userId,
        members: [],
        expenses: [],
        shares: {
          totalExpenses: 600,
          shares: [
            {
              memberId: "member-2",
              userId,
              pseudo: "TestUser",
              sharePercentage: 100,
              shareAmount: 600,
            },
          ],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    const result = selectUserRemainingCapacity(store.getState());

    expect(result).not.toBeNull();
    expect(result?.monthlyCapacity).toBe(1000);
    expect(result?.totalGroupContributions).toBe(1400);
    expect(result?.remainingAfterAllGroups).toBe(-400);
    expect(result?.isNegative).toBe(true);
  });

  it("should handle user with zero capacity", () => {
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        email: "test@example.com",
        monthlyIncome: 1000,
        capacity: 0,
        currency: "EUR",
        shareRevenue: true,
        hasCompletedOnboarding: true,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    const result = selectUserRemainingCapacity(store.getState());

    expect(result).not.toBeNull();
    expect(result?.monthlyCapacity).toBe(0);
    expect(result?.totalGroupContributions).toBe(0);
    expect(result?.remainingAfterAllGroups).toBe(0);
    expect(result?.isNegative).toBe(false);
  });

  it("should ignore groups where user is not a member", () => {
    const group1Id = "group-1";
    const group2Id = "group-2";

    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        email: "test@example.com",
        monthlyIncome: 3000,
        capacity: 2800,
        currency: "EUR",
        shareRevenue: true,
        hasCompletedOnboarding: true,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    store.dispatch({
      type: "groups/loadGroupById/fulfilled",
      payload: {
        id: group1Id,
        name: "Foyer",
        currency: "EUR",
        creatorId: userId,
        members: [],
        expenses: [],
        shares: {
          totalExpenses: 1000,
          shares: [
            {
              memberId: "member-1",
              userId,
              pseudo: "TestUser",
              sharePercentage: 100,
              shareAmount: 600,
            },
          ],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    store.dispatch({
      type: "groups/loadGroupById/fulfilled",
      payload: {
        id: group2Id,
        name: "Autre Groupe",
        currency: "EUR",
        creatorId: "other-user",
        members: [],
        expenses: [],
        shares: {
          totalExpenses: 500,
          shares: [
            {
              memberId: "member-2",
              userId: "other-user",
              pseudo: "OtherUser",
              sharePercentage: 100,
              shareAmount: 500,
            },
          ],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    const result = selectUserRemainingCapacity(store.getState());

    expect(result).not.toBeNull();
    expect(result?.monthlyCapacity).toBe(2800);
    expect(result?.totalGroupContributions).toBe(600);
    expect(result?.remainingAfterAllGroups).toBe(2200);
    expect(result?.isNegative).toBe(false);
  });
});

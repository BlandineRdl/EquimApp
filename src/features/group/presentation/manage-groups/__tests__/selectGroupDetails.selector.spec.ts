/**
 * Tests for selectGroupDetails selector
 * Verifies calculation of share amounts and remaining capacity after group contributions
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { ReduxStore } from "../../../../../store/buildReduxStore";
import { initReduxStore } from "../../../../../store/buildReduxStore";
import { InMemoryUserGateway } from "../../../../user/infra/InMemoryUserGateway";
import { InMemoryGroupGateway } from "../../../infra/inMemoryGroup.gateway";
import { selectGroupDetails } from "../selectGroupDetails.selector";

describe("selectGroupDetails", () => {
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

    // Simulate auth state
    store.dispatch({
      type: "auth/signIn/fulfilled",
      payload: { userId },
    });
  });

  it("should return null when group does not exist", () => {
    const result = selectGroupDetails(store.getState(), "non-existent-group");
    expect(result).toBeNull();
  });

  it("should calculate remainingAfterShare correctly for a single member", () => {
    const memberId = "member-1";
    const monthlyCapacity = 2500; // Income - personal expenses
    const shareAmount = 800; // Member's contribution to group

    // Load group with one member
    store.dispatch({
      type: "groups/loadGroupById/fulfilled",
      payload: {
        id: groupId,
        name: "Foyer",
        currency: "EUR",
        creatorId: userId,
        members: [
          {
            id: memberId,
            userId,
            pseudo: "TestUser",
            shareRevenue: true,
            incomeOrWeight: 3000,
            monthlyCapacity,
            joinedAt: "2024-01-01",
            isPhantom: false,
          },
        ],
        expenses: [
          {
            id: "expense-1",
            groupId,
            name: "Loyer",
            amount: 800,
            currency: "EUR",
            isPredefined: false,
            createdBy: userId,
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
          },
        ],
        shares: {
          totalExpenses: 800,
          shares: [
            {
              memberId,
              userId,
              pseudo: "TestUser",
              sharePercentage: 100,
              shareAmount,
            },
          ],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    const result = selectGroupDetails(store.getState(), groupId);

    expect(result).not.toBeNull();
    expect(result?.members).toHaveLength(1);
    expect(result?.members[0].monthlyCapacity).toBe(monthlyCapacity);
    expect(result?.members[0].shareAmount).toBe(shareAmount);
    expect(result?.members[0].remainingAfterShare).toBe(
      monthlyCapacity - shareAmount,
    );
    expect(result?.members[0].remainingAfterShare).toBe(1700);
  });

  it("should calculate remainingAfterShare for multiple members with different capacities", () => {
    const member1Id = "member-1";
    const member2Id = "member-2";

    // Member 1: High income, high capacity
    const member1Capacity = 3000;
    const member1Share = 600;

    // Member 2: Lower income, lower capacity
    const member2Capacity = 1500;
    const member2Share = 400;

    store.dispatch({
      type: "groups/loadGroupById/fulfilled",
      payload: {
        id: groupId,
        name: "Foyer",
        currency: "EUR",
        creatorId: userId,
        members: [
          {
            id: member1Id,
            userId,
            pseudo: "Member 1",
            shareRevenue: true,
            incomeOrWeight: 3500,
            monthlyCapacity: member1Capacity,
            joinedAt: "2024-01-01",
            isPhantom: false,
          },
          {
            id: member2Id,
            userId: "user-2",
            pseudo: "Member 2",
            shareRevenue: true,
            incomeOrWeight: 2000,
            monthlyCapacity: member2Capacity,
            joinedAt: "2024-01-01",
            isPhantom: false,
          },
        ],
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
        ],
        shares: {
          totalExpenses: 1000,
          shares: [
            {
              memberId: member1Id,
              userId,
              pseudo: "Member 1",
              sharePercentage: 60,
              shareAmount: member1Share,
            },
            {
              memberId: member2Id,
              userId: "user-2",
              pseudo: "Member 2",
              sharePercentage: 40,
              shareAmount: member2Share,
            },
          ],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    const result = selectGroupDetails(store.getState(), groupId);

    expect(result).not.toBeNull();
    expect(result?.members).toHaveLength(2);

    // Verify Member 1
    const resultMember1 = result?.members.find((m) => m.id === member1Id);
    expect(resultMember1?.remainingAfterShare).toBe(
      member1Capacity - member1Share,
    );
    expect(resultMember1?.remainingAfterShare).toBe(2400);

    // Verify Member 2
    const resultMember2 = result?.members.find((m) => m.id === member2Id);
    expect(resultMember2?.remainingAfterShare).toBe(
      member2Capacity - member2Share,
    );
    expect(resultMember2?.remainingAfterShare).toBe(1100);
  });

  it("should handle negative remainingAfterShare when share exceeds capacity", () => {
    const memberId = "member-1";
    const monthlyCapacity = 500; // Low capacity
    const shareAmount = 800; // High share amount

    store.dispatch({
      type: "groups/loadGroupById/fulfilled",
      payload: {
        id: groupId,
        name: "Foyer",
        currency: "EUR",
        creatorId: userId,
        members: [
          {
            id: memberId,
            userId,
            pseudo: "TestUser",
            shareRevenue: true,
            incomeOrWeight: 1000,
            monthlyCapacity,
            joinedAt: "2024-01-01",
            isPhantom: false,
          },
        ],
        expenses: [
          {
            id: "expense-1",
            groupId,
            name: "Loyer",
            amount: 800,
            currency: "EUR",
            isPredefined: false,
            createdBy: userId,
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
          },
        ],
        shares: {
          totalExpenses: 800,
          shares: [
            {
              memberId,
              userId,
              pseudo: "TestUser",
              sharePercentage: 100,
              shareAmount,
            },
          ],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    const result = selectGroupDetails(store.getState(), groupId);

    expect(result).not.toBeNull();
    expect(result?.members).toHaveLength(1);
    expect(result?.members[0].remainingAfterShare).toBe(
      monthlyCapacity - shareAmount,
    );
    expect(result?.members[0].remainingAfterShare).toBe(-300);
  });

  it("should handle phantom members correctly", () => {
    const phantomMemberId = "phantom-1";
    const phantomIncome = 2000;
    const phantomShare = 500;

    store.dispatch({
      type: "groups/loadGroupById/fulfilled",
      payload: {
        id: groupId,
        name: "Foyer",
        currency: "EUR",
        creatorId: userId,
        members: [
          {
            id: phantomMemberId,
            userId: null,
            pseudo: "Membre-Bob",
            shareRevenue: true,
            incomeOrWeight: phantomIncome,
            monthlyCapacity: phantomIncome, // Phantoms have no personal expenses
            joinedAt: "2024-01-01",
            isPhantom: true,
          },
        ],
        expenses: [
          {
            id: "expense-1",
            groupId,
            name: "Loyer",
            amount: 500,
            currency: "EUR",
            isPredefined: false,
            createdBy: userId,
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
          },
        ],
        shares: {
          totalExpenses: 500,
          shares: [
            {
              memberId: phantomMemberId,
              userId: null,
              pseudo: "Membre-Bob",
              sharePercentage: 100,
              shareAmount: phantomShare,
            },
          ],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    const result = selectGroupDetails(store.getState(), groupId);

    expect(result).not.toBeNull();
    expect(result?.members).toHaveLength(1);
    expect(result?.members[0].isPhantom).toBe(true);
    expect(result?.members[0].monthlyCapacity).toBe(phantomIncome);
    expect(result?.members[0].shareAmount).toBe(phantomShare);
    expect(result?.members[0].remainingAfterShare).toBe(
      phantomIncome - phantomShare,
    );
    expect(result?.members[0].remainingAfterShare).toBe(1500);
  });

  it("should handle members with zero monthly capacity", () => {
    const memberId = "member-1";
    const monthlyCapacity = 0;
    const shareAmount = 0;

    store.dispatch({
      type: "groups/loadGroupById/fulfilled",
      payload: {
        id: groupId,
        name: "Foyer",
        currency: "EUR",
        creatorId: userId,
        members: [
          {
            id: memberId,
            userId,
            pseudo: "TestUser",
            shareRevenue: true,
            incomeOrWeight: 0,
            monthlyCapacity,
            joinedAt: "2024-01-01",
            isPhantom: false,
          },
        ],
        expenses: [],
        shares: {
          totalExpenses: 0,
          shares: [
            {
              memberId,
              userId,
              pseudo: "TestUser",
              sharePercentage: 0,
              shareAmount,
            },
          ],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    const result = selectGroupDetails(store.getState(), groupId);

    expect(result).not.toBeNull();
    expect(result?.members).toHaveLength(1);
    expect(result?.members[0].remainingAfterShare).toBe(0);
  });

  it("should handle null monthlyCapacity gracefully", () => {
    const memberId = "member-1";
    const shareAmount = 100;

    store.dispatch({
      type: "groups/loadGroupById/fulfilled",
      payload: {
        id: groupId,
        name: "Foyer",
        currency: "EUR",
        creatorId: userId,
        members: [
          {
            id: memberId,
            userId,
            pseudo: "TestUser",
            shareRevenue: true,
            incomeOrWeight: null,
            monthlyCapacity: null,
            joinedAt: "2024-01-01",
            isPhantom: false,
          },
        ],
        expenses: [
          {
            id: "expense-1",
            groupId,
            name: "Loyer",
            amount: 100,
            currency: "EUR",
            isPredefined: false,
            createdBy: userId,
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
          },
        ],
        shares: {
          totalExpenses: 100,
          shares: [
            {
              memberId,
              userId,
              pseudo: "TestUser",
              sharePercentage: 100,
              shareAmount,
            },
          ],
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    });

    const result = selectGroupDetails(store.getState(), groupId);

    expect(result).not.toBeNull();
    expect(result?.members).toHaveLength(1);
    // null capacity is treated as 0
    expect(result?.members[0].remainingAfterShare).toBe(0 - shareAmount);
    expect(result?.members[0].remainingAfterShare).toBe(-100);
  });
});

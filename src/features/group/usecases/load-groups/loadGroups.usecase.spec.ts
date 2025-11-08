import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../../store/buildReduxStore";
import { InMemoryAuthGateway } from "../../../auth/infra/InMemoryAuthGateway";
import { initSession } from "../../../auth/usecases/manage-session/initSession.usecase";
import { InMemoryUserGateway } from "../../../user/infra/InMemoryUserGateway";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import { loadUserGroups } from "./loadGroups.usecase";

describe("Feature: Load user groups", () => {
  let store: ReduxStore;
  let groupGateway: InMemoryGroupGateway;
  let authGateway: InMemoryAuthGateway;
  let userGateway: InMemoryUserGateway;
  const userEmail = "test-user@example.com";
  const userId = `user-${userEmail}`;

  beforeEach(async () => {
    groupGateway = new InMemoryGroupGateway();
    authGateway = new InMemoryAuthGateway();
    userGateway = new InMemoryUserGateway();
    store = initReduxStore({ groupGateway, authGateway, userGateway });

    await authGateway.verifyOtp(userEmail, "123456");
    await store.dispatch(initSession());
  });

  describe("Success scenarios", () => {
    it("should load all user groups", async () => {
      const group1 = await groupGateway.createGroup("Group 1", "EUR");
      const group2 = await groupGateway.createGroup("Group 2", "USD");
      await groupGateway.addMember(group1.groupId, userId);
      await groupGateway.addMember(group2.groupId, userId);

      const result = await store.dispatch(loadUserGroups());

      expect(result.type).toBe("groups/loadUserGroups/fulfilled");
      if ("payload" in result && result.payload) {
        const groups = result.payload as unknown[];
        expect(groups).toBeDefined();
        expect(groups.length).toBeGreaterThan(0);
      }

      const state = store.getState();
      expect(Object.keys(state.groups.entities).length).toBeGreaterThan(0);
    });

    it("should return empty array when user has no groups", async () => {
      const result = await store.dispatch(loadUserGroups());

      expect(result.type).toBe("groups/loadUserGroups/fulfilled");
      if ("payload" in result && result.payload) {
        const groups = result.payload as unknown[];
        expect(groups).toEqual([]);
      }
    });

    it("should include full group details for each group", async () => {
      const createResult = await groupGateway.createGroup("Ma Coloc", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);
      await groupGateway.addMember(groupId, "other-user");
      await groupGateway.createExpense({
        groupId,
        name: "Loyer",
        amount: 1200,
        currency: "EUR",
        isPredefined: false,
      });

      const result = await store.dispatch(loadUserGroups());

      expect(result.type).toBe("groups/loadUserGroups/fulfilled");
      if ("payload" in result && result.payload) {
        const groups = result.payload as Array<{
          id: string;
          name: string;
          members: unknown[];
          expenses: unknown[];
          shares: { totalExpenses: number };
          totalMonthlyBudget: number;
        }>;
        expect(groups.length).toBe(1);
        expect(groups[0].name).toBe("Ma Coloc");
        expect(groups[0].members.length).toBeGreaterThan(0);
        expect(groups[0].expenses.length).toBe(1);
        expect(groups[0].shares).toBeDefined();
        expect(groups[0].totalMonthlyBudget).toBeDefined();
      }
    });

    it("should calculate totalMonthlyBudget from shares", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);
      await groupGateway.createExpense({
        groupId,
        name: "Expense 1",
        amount: 100,
        currency: "EUR",
        isPredefined: false,
      });
      await groupGateway.createExpense({
        groupId,
        name: "Expense 2",
        amount: 50,
        currency: "EUR",
        isPredefined: false,
      });

      const result = await store.dispatch(loadUserGroups());

      expect(result.type).toBe("groups/loadUserGroups/fulfilled");
      if ("payload" in result && result.payload) {
        const groups = result.payload as Array<{
          shares: { totalExpenses: number };
          totalMonthlyBudget: number;
        }>;
        expect(groups[0].totalMonthlyBudget).toBe(
          groups[0].shares.totalExpenses,
        );
        expect(groups[0].totalMonthlyBudget).toBe(150);
      }
    });
  });

  describe("Error scenarios", () => {
    it("should reject when user is not authenticated", async () => {
      await authGateway.signOut();
      await store.dispatch(initSession());

      const result = await store.dispatch(loadUserGroups());

      expect(result.type).toBe("groups/loadUserGroups/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("authenticated");
      }
    });
  });

  describe("Business rules", () => {
    it("should load each group with all its data", async () => {
      const group1 = await groupGateway.createGroup("Group 1", "EUR");
      const group2 = await groupGateway.createGroup("Group 2", "USD");

      await groupGateway.addMember(group1.groupId, userId);
      await groupGateway.addMember(group2.groupId, userId);

      await groupGateway.createExpense({
        groupId: group1.groupId,
        name: "Expense 1",
        amount: 100,
        currency: "EUR",
        isPredefined: false,
      });

      const result = await store.dispatch(loadUserGroups());

      expect(result.type).toBe("groups/loadUserGroups/fulfilled");
      if ("payload" in result && result.payload) {
        const groups = result.payload as Array<{
          id: string;
          name: string;
          currency: string;
          members: unknown[];
          expenses: unknown[];
        }>;
        expect(groups.length).toBe(2);

        const loadedGroup1 = groups.find((g) => g.name === "Group 1");
        expect(loadedGroup1).toBeDefined();
        expect(loadedGroup1?.expenses.length).toBe(1);
        expect(loadedGroup1?.currency).toBe("EUR");

        const loadedGroup2 = groups.find((g) => g.name === "Group 2");
        expect(loadedGroup2).toBeDefined();
        expect(loadedGroup2?.expenses.length).toBe(0);
        expect(loadedGroup2?.currency).toBe("USD");
      }
    });
  });
});

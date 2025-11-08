import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../../store/buildReduxStore";
import { InMemoryAuthGateway } from "../../../auth/infra/InMemoryAuthGateway";
import { InMemoryUserGateway } from "../../../user/infra/InMemoryUserGateway";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import { loadGroupById } from "./loadGroup.usecase";

describe("Feature: Load group details", () => {
  let store: ReduxStore;
  let groupGateway: InMemoryGroupGateway;
  let authGateway: InMemoryAuthGateway;
  let userGateway: InMemoryUserGateway;

  beforeEach(() => {
    groupGateway = new InMemoryGroupGateway();
    authGateway = new InMemoryAuthGateway();
    userGateway = new InMemoryUserGateway();
    store = initReduxStore({ groupGateway, authGateway, userGateway });
  });

  describe("Success scenarios", () => {
    it("should load group details by ID", async () => {
      const createResult = await groupGateway.createGroup("Ma Coloc", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, "user-123");

      const result = await store.dispatch(loadGroupById(groupId));

      expect(result.type).toBe("groups/loadGroupById/fulfilled");
      if ("payload" in result && result.payload) {
        const group = result.payload as {
          id: string;
          name: string;
          currency: string;
          members: unknown[];
        };
        expect(group.id).toBe(groupId);
        expect(group.name).toBe("Ma Coloc");
        expect(group.currency).toBe("EUR");
        expect(group.members).toBeDefined();
      }

      const state = store.getState();
      expect(state.groups.entities[groupId]).toBeDefined();
      expect(state.groups.entities[groupId]?.name).toBe("Ma Coloc");
    });

    it("should include members in group details", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, "user-1");
      await groupGateway.addMember(groupId, "user-2");

      const result = await store.dispatch(loadGroupById(groupId));

      expect(result.type).toBe("groups/loadGroupById/fulfilled");
      if ("payload" in result && result.payload) {
        const group = result.payload as { members: unknown[] };
        expect(group.members).toBeDefined();
        expect(group.members.length).toBeGreaterThan(0);
      }
    });

    it("should include expenses in group details", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, "user-123");
      await groupGateway.createExpense({
        groupId,
        name: "Loyer",
        amount: 1000,
        currency: "EUR",
        isPredefined: false,
      });

      const result = await store.dispatch(loadGroupById(groupId));

      expect(result.type).toBe("groups/loadGroupById/fulfilled");
      if ("payload" in result && result.payload) {
        const group = result.payload as { expenses: unknown[] };
        expect(group.expenses).toBeDefined();
        expect(group.expenses.length).toBe(1);
      }
    });

    it("should include shares in group details", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, "user-123");
      await groupGateway.createExpense({
        groupId,
        name: "Test Expense",
        amount: 100,
        currency: "EUR",
        isPredefined: false,
      });

      const result = await store.dispatch(loadGroupById(groupId));

      expect(result.type).toBe("groups/loadGroupById/fulfilled");
      if ("payload" in result && result.payload) {
        const group = result.payload as {
          shares: { totalExpenses: number };
          totalMonthlyBudget: number;
        };
        expect(group.shares).toBeDefined();
        expect(group.shares.totalExpenses).toBeDefined();
        expect(group.totalMonthlyBudget).toBe(group.shares.totalExpenses);
      }
    });

    it("should include timestamps in group details", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      const result = await store.dispatch(loadGroupById(groupId));

      expect(result.type).toBe("groups/loadGroupById/fulfilled");
      if ("payload" in result && result.payload) {
        const group = result.payload as {
          createdAt: string;
          updatedAt: string;
        };
        expect(group.createdAt).toBeDefined();
        expect(group.updatedAt).toBeDefined();
      }
    });
  });

  describe("Error scenarios", () => {
    it("should reject when group does not exist", async () => {
      const nonExistentId = "non-existent-group-id";

      const result = await store.dispatch(loadGroupById(nonExistentId));

      expect(result.type).toBe("groups/loadGroupById/rejected");
    });
  });
});

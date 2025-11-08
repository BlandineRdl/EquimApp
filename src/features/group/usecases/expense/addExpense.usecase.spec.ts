import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../../store/buildReduxStore";
import type { AppError } from "../../../../types/thunk.types";
import { InMemoryAuthGateway } from "../../../auth/infra/InMemoryAuthGateway";
import { initSession } from "../../../auth/usecases/manage-session/initSession.usecase";
import { InMemoryUserGateway } from "../../../user/infra/InMemoryUserGateway";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import { loadGroupById } from "../load-group/loadGroup.usecase";
import { addExpenseToGroup } from "./addExpense.usecase";

describe("Feature: Add expense", () => {
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
    it("should add expense with valid name and amount", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "Courses",
          amount: 50,
        }),
      );

      expect(result.type).toBe("groups/addExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const payload = result.payload as {
          groupId: string;
          expense: { id: string; name: string; amount: number };
        };
        expect(payload.groupId).toBe(groupId);
        expect(payload.expense.name).toBe("Courses");
        expect(payload.expense.amount).toBe(50);
        expect(payload.expense.id).toBeDefined();
      }

      const state = store.getState();
      const group = state.groups.entities[groupId];
      expect(group?.expenses.length).toBeGreaterThan(0);
    });

    it("should trim whitespace from expense name", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "  Restaurant  ",
          amount: 80,
        }),
      );

      expect(result.type).toBe("groups/addExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const payload = result.payload as { expense: { name: string } };
        expect(payload.expense.name).toBe("Restaurant");
      }
    });

    it("should use group currency for expense", async () => {
      const createResult = await groupGateway.createGroup("US Group", "USD");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "Shopping",
          amount: 100,
        }),
      );

      expect(result.type).toBe("groups/addExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const payload = result.payload as { expense: { currency: string } };
        expect(payload.expense.currency).toBe("USD");
      }
    });

    it("should recalculate shares after adding expense", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "Loyer",
          amount: 1200,
        }),
      );

      expect(result.type).toBe("groups/addExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const payload = result.payload as { shares: { totalExpenses: number } };
        expect(payload.shares).toBeDefined();
        expect(payload.shares.totalExpenses).toBeDefined();
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject when group does not exist in state", async () => {
      const result = await store.dispatch(
        addExpenseToGroup({
          groupId: "non-existent-group",
          name: "Test",
          amount: 50,
        }),
      );

      expect(result.type).toBe("groups/addExpense/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("non trouvé");
      }
    });

    it("should reject empty expense name", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "",
          amount: 50,
        }),
      );

      expect(result.type).toBe("groups/addExpense/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("vide");
      }
    });

    it("should reject whitespace-only expense name", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "   ",
          amount: 50,
        }),
      );

      expect(result.type).toBe("groups/addExpense/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("vide");
      }
    });

    it("should reject zero amount", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "Test",
          amount: 0,
        }),
      );

      expect(result.type).toBe("groups/addExpense/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("supérieur à 0");
      }
    });

    it("should reject negative amount", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "Test",
          amount: -50,
        }),
      );

      expect(result.type).toBe("groups/addExpense/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("supérieur à 0");
      }
    });
  });

  describe("Business rules", () => {
    it("should mark expense as not predefined by default", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "Custom Expense",
          amount: 75,
        }),
      );

      expect(result.type).toBe("groups/addExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const payload = result.payload as {
          expense: { isPredefined: boolean };
        };
        expect(payload.expense.isPredefined).toBe(false);
      }
    });

    it("should set createdBy to current user", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "My Expense",
          amount: 60,
        }),
      );

      expect(result.type).toBe("groups/addExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const payload = result.payload as { expense: { createdBy: string } };
        expect(payload.expense.createdBy).toBe(userId);
      }
    });
  });
});

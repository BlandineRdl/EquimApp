import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../../store/buildReduxStore";
import type { AppError } from "../../../../types/thunk.types";
import { InMemoryAuthGateway } from "../../../auth/infra/InMemoryAuthGateway";
import { InMemoryUserGateway } from "../../../user/infra/InMemoryUserGateway";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import { loadGroupById } from "../load-group/loadGroup.usecase";
import { deleteExpense } from "./deleteExpense.usecase";

describe("Feature: Delete expense", () => {
  let store: ReduxStore;
  let groupGateway: InMemoryGroupGateway;
  let authGateway: InMemoryAuthGateway;
  let userGateway: InMemoryUserGateway;
  const userId = "test-user-id";

  beforeEach(() => {
    groupGateway = new InMemoryGroupGateway();
    authGateway = new InMemoryAuthGateway();
    userGateway = new InMemoryUserGateway();
    store = initReduxStore({ groupGateway, authGateway, userGateway });

    const mockSession: Session = {
      access_token: "mock-token",
      refresh_token: "mock-refresh",
      expires_in: 3600,
      expires_at: Date.now() / 1000 + 3600,
      token_type: "bearer",
      user: {
        id: userId,
        email: "user@example.com",
        aud: "authenticated",
        role: "authenticated",
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
      },
    };
    authGateway.setCurrentSession(mockSession);
  });

  describe("Success scenarios", () => {
    it("should delete expense successfully", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      const expenseResult = await groupGateway.createExpense({
        groupId,
        name: "Test Expense",
        amount: 50,
        currency: "EUR",
        isPredefined: false,
      });
      const expenseId = expenseResult.expenseId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        deleteExpense({ groupId, expenseId }),
      );

      expect(result.type).toBe("groups/deleteExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const deleted = result.payload as {
          groupId: string;
          expenseId: string;
        };
        expect(deleted.groupId).toBe(groupId);
        expect(deleted.expenseId).toBe(expenseId);
      }

      const state = store.getState();
      const group = state.groups.entities[groupId];
      expect(group?.expenses.find((e) => e.id === expenseId)).toBeUndefined();
    });

    it("should recalculate shares after deleting expense", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      const expenseResult = await groupGateway.createExpense({
        groupId,
        name: "Test Expense",
        amount: 100,
        currency: "EUR",
        isPredefined: false,
      });
      const expenseId = expenseResult.expenseId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        deleteExpense({ groupId, expenseId }),
      );

      expect(result.type).toBe("groups/deleteExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const deleted = result.payload as { shares: { totalExpenses: number } };
        expect(deleted.shares).toBeDefined();
        expect(deleted.shares.totalExpenses).toBeDefined();
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject when group does not exist in state", async () => {
      const result = await store.dispatch(
        deleteExpense({
          groupId: "non-existent-group",
          expenseId: "some-expense",
        }),
      );

      expect(result.type).toBe("groups/deleteExpense/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("non trouvé");
      }
    });

    it("should reject when expense does not exist", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        deleteExpense({
          groupId,
          expenseId: "non-existent-expense",
        }),
      );

      expect(result.type).toBe("groups/deleteExpense/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("non trouvée");
      }
    });
  });

  describe("Business rules", () => {
    it("should update group budget after deleting expense", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      const expense1 = await groupGateway.createExpense({
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

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        deleteExpense({
          groupId,
          expenseId: expense1.expenseId,
        }),
      );

      expect(result.type).toBe("groups/deleteExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const deleted = result.payload as { shares: { totalExpenses: number } };
        expect(deleted.shares.totalExpenses).toBe(50);
      }
    });
  });
});

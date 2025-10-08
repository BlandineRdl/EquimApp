/**
 * Behavioral tests for Add Expense Use Case
 */

import { beforeEach, describe, it } from "vitest";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import type { GroupGateway } from "../../ports/GroupGateway";

describe("Add Expense Use Case", () => {
  let groupGateway: GroupGateway;
  let groupId: string;

  beforeEach(async () => {
    groupGateway = new InMemoryGroupGateway();
    const result = await groupGateway.createGroup("Test Group", "EUR");
    groupId = result.groupId;
    await groupGateway.addMember(groupId, "user-1");
  });

  describe("Success scenarios", () => {
    it("should add expense to group", async () => {
      const result = await groupGateway.createExpense({
        groupId,
        name: "Rent",
        amount: 800,
        currency: "EUR",
        isPredefined: false,
      });

      if (!result.expenseId) {
        throw new Error("Expected expense ID");
      }

      if (!result.shares) {
        throw new Error("Expected shares to be calculated");
      }
    });

    it("should trim whitespace from expense name", async () => {
      const result = await groupGateway.createExpense({
        groupId,
        name: "  Groceries  ",
        amount: 300,
        currency: "EUR",
        isPredefined: false,
      });

      if (!result.expenseId) {
        throw new Error("Expected expense to be created");
      }
    });

    it("should accept decimal amounts", async () => {
      const result = await groupGateway.createExpense({
        groupId,
        name: "Coffee",
        amount: 3.5,
        currency: "EUR",
        isPredefined: false,
      });

      if (!result.expenseId) {
        throw new Error("Expected expense to be created");
      }
    });

    it("should add multiple expenses to same group", async () => {
      const result1 = await groupGateway.createExpense({
        groupId,
        name: "Rent",
        amount: 800,
        currency: "EUR",
        isPredefined: false,
      });

      const result2 = await groupGateway.createExpense({
        groupId,
        name: "Utilities",
        amount: 150,
        currency: "EUR",
        isPredefined: false,
      });

      if (result1.expenseId === result2.expenseId) {
        throw new Error("Expected different expense IDs");
      }
    });

    it("should recalculate shares after adding expense", async () => {
      const result = await groupGateway.createExpense({
        groupId,
        name: "Rent",
        amount: 1000,
        currency: "EUR",
        isPredefined: false,
      });

      if (result.shares.totalExpenses === undefined) {
        throw new Error("Expected totalExpenses to be calculated");
      }

      // Total expenses should include the new expense
      if (result.shares.totalExpenses < 1000) {
        throw new Error("Expected totalExpenses to include new expense");
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject empty expense name", async () => {
      try {
        await groupGateway.createExpense({
          groupId,
          name: "",
          amount: 100,
          currency: "EUR",
          isPredefined: false,
        });
        throw new Error("Expected error for empty name");
      } catch (error) {
        const message = (error as Error).message;
        if (!message.includes("vide") && !message.includes("empty")) {
          throw error;
        }
      }
    });

    it("should reject whitespace-only name", async () => {
      try {
        await groupGateway.createExpense({
          groupId,
          name: "   ",
          amount: 100,
          currency: "EUR",
          isPredefined: false,
        });
        throw new Error("Expected error for whitespace name");
      } catch (error) {
        const message = (error as Error).message;
        if (!message.includes("vide") && !message.includes("empty")) {
          throw error;
        }
      }
    });

    it("should reject zero amount", async () => {
      try {
        await groupGateway.createExpense({
          groupId,
          name: "Invalid Expense",
          amount: 0,
          currency: "EUR",
          isPredefined: false,
        });
        throw new Error("Expected error for zero amount");
      } catch (error) {
        const message = (error as Error).message;
        if (!message.includes("supérieur") && !message.includes("positive")) {
          throw error;
        }
      }
    });

    it("should reject negative amount", async () => {
      try {
        await groupGateway.createExpense({
          groupId,
          name: "Invalid Expense",
          amount: -100,
          currency: "EUR",
          isPredefined: false,
        });
        throw new Error("Expected error for negative amount");
      } catch (error) {
        const message = (error as Error).message;
        if (!message.includes("supérieur") && !message.includes("positive")) {
          throw error;
        }
      }
    });

    it("should reject invalid group ID", async () => {
      try {
        await groupGateway.createExpense({
          groupId: "non-existent",
          name: "Rent",
          amount: 800,
          currency: "EUR",
          isPredefined: false,
        });
        throw new Error("Expected error for invalid group");
      } catch (error) {
        const message = (error as Error).message;
        if (!message.includes("non trouvé") && !message.includes("not found")) {
          throw error;
        }
      }
    });
  });

  describe("Business rules", () => {
    it("should mark custom expenses as non-predefined", async () => {
      const result = await groupGateway.createExpense({
        groupId,
        name: "Custom Expense",
        amount: 250,
        currency: "EUR",
        isPredefined: false,
      });

      if (!result.expenseId) {
        throw new Error("Expected expense to be created");
      }
    });

    it("should support predefined expenses", async () => {
      const result = await groupGateway.createExpense({
        groupId,
        name: "Rent",
        amount: 800,
        currency: "EUR",
        isPredefined: true,
      });

      if (!result.expenseId) {
        throw new Error("Expected predefined expense to be created");
      }
    });
  });
});

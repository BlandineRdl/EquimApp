import { beforeEach, describe, it } from "vitest";
import { InMemoryUserGateway } from "../infra/inMemoryUser.gateway";
import type { UserGateway } from "../ports/UserGateway";

describe("Add Personal Expense Use Case", () => {
  let userGateway: UserGateway;
  const userId = "test-user-id";

  beforeEach(async () => {
    userGateway = new InMemoryUserGateway();
    await userGateway.createProfile({
      id: userId,
      pseudo: "Test User",
      income: 2000,
      currency: "EUR",
      shareRevenue: true,
    });
  });

  it("should add expense and recalculate capacity", async () => {
    const expense = await userGateway.addPersonalExpense(userId, {
      label: "Rent",
      amount: 800,
    });

    if (!expense.id) {
      throw new Error("Expected expense ID");
    }

    const profile = await userGateway.getProfileById(userId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    if (profile.capacity !== 1200) {
      throw new Error(`Expected capacity 1200, got ${profile.capacity}`);
    }
  });

  it("should allow negative capacity", async () => {
    await userGateway.addPersonalExpense(userId, {
      label: "Rent",
      amount: 2500,
    });

    const profile = await userGateway.getProfileById(userId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    if (profile.capacity !== -500) {
      throw new Error(`Expected capacity -500, got ${profile.capacity}`);
    }
  });

  it("should add multiple expenses", async () => {
    await userGateway.addPersonalExpense(userId, {
      label: "Rent",
      amount: 800,
    });

    await userGateway.addPersonalExpense(userId, {
      label: "Transport",
      amount: 100,
    });

    const expenses = await userGateway.loadPersonalExpenses(userId);
    if (expenses.length !== 2) {
      throw new Error(`Expected 2 expenses, got ${expenses.length}`);
    }

    const profile = await userGateway.getProfileById(userId);
    if (profile?.capacity !== 1100) {
      throw new Error(`Expected capacity 1100, got ${profile?.capacity}`);
    }
  });
});

import { beforeEach, describe, it } from "vitest";
import { InMemoryUserGateway } from "../infra/inMemoryUser.gateway";
import type { UserGateway } from "../ports/UserGateway";

describe("Update Personal Expense Use Case", () => {
  let userGateway: UserGateway;
  const userId = "test-user-id";
  let expenseId: string;

  beforeEach(async () => {
    userGateway = new InMemoryUserGateway();
    await userGateway.createProfile({
      id: userId,
      pseudo: "Test User",
      income: 2000,
      currency: "EUR",
      shareRevenue: true,
    });

    const expense = await userGateway.addPersonalExpense(userId, {
      label: "Rent",
      amount: 800,
    });
    expenseId = expense.id;
  });

  it("should update expense and recalculate capacity", async () => {
    await userGateway.updatePersonalExpense(userId, {
      id: expenseId,
      label: "Updated Rent",
      amount: 900,
    });

    const profile = await userGateway.getProfileById(userId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    if (profile.capacity !== 1100) {
      throw new Error(`Expected capacity 1100, got ${profile.capacity}`);
    }
  });

  it("should recalculate capacity when amount decreases", async () => {
    await userGateway.updatePersonalExpense(userId, {
      id: expenseId,
      label: "Rent",
      amount: 500,
    });

    const profile = await userGateway.getProfileById(userId);
    if (profile?.capacity !== 1500) {
      throw new Error(`Expected capacity 1500, got ${profile?.capacity}`);
    }
  });
});

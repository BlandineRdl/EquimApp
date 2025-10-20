import { beforeEach, describe, it } from "vitest";
import { InMemoryUserGateway } from "../infra/inMemoryUser.gateway";
import type { UserGateway } from "../ports/UserGateway";

describe("Delete Personal Expense Use Case", () => {
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

  it("should delete expense and recalculate capacity", async () => {
    await userGateway.deletePersonalExpense(userId, expenseId);

    const expenses = await userGateway.loadPersonalExpenses(userId);
    if (expenses.length !== 0) {
      throw new Error(`Expected 0 expenses, got ${expenses.length}`);
    }

    const profile = await userGateway.getProfileById(userId);
    if (profile?.capacity !== 2000) {
      throw new Error(`Expected capacity 2000, got ${profile?.capacity}`);
    }
  });
});

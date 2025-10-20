import { BaseDsl } from "../../../test/dsl";
import { InMemoryUserGateway } from "../infra/inMemoryUser.gateway";
import type { UserGateway } from "../ports/UserGateway";

export class DeletePersonalExpenseDSL extends BaseDsl<void> {
  private userGateway: UserGateway;
  private userId = "test-user-id";
  private expenseId = "";

  constructor() {
    super();
    this.userGateway = new InMemoryUserGateway();
  }

  // ============================================================================
  // GIVEN - Setup initial state
  // ============================================================================

  givenUserWithExpense(income = 2000, expenseAmount = 800): this {
    this.setupPromise = this._createUserWithExpense(income, expenseAmount);
    return this;
  }

  private async _createUserWithExpense(
    income: number,
    expenseAmount: number,
  ): Promise<void> {
    await this.userGateway.createProfile({
      id: this.userId,
      pseudo: "Test User",
      income,
      currency: "EUR",
      shareRevenue: true,
    });

    const expense = await this.userGateway.addPersonalExpense(this.userId, {
      label: "Rent",
      amount: expenseAmount,
    });

    this.expenseId = expense.id;
  }

  // ============================================================================
  // WHEN - Execute the action
  // ============================================================================

  async whenDeletingExpense(): Promise<this> {
    await this.executeAction(async () => {
      await this.userGateway.deletePersonalExpense(this.userId, this.expenseId);
    });

    return this;
  }

  // ============================================================================
  // THEN - Assertions
  // ============================================================================

  async thenExpenseShouldBeDeleted(): Promise<this> {
    const expenses = await this.userGateway.loadPersonalExpenses(this.userId);

    if (expenses.length !== 0) {
      throw new Error(`Expected 0 expenses, got ${expenses.length}`);
    }

    return this;
  }

  async thenCapacityShouldBeRecalculated(
    expectedCapacity: number,
  ): Promise<this> {
    const profile = await this.userGateway.getProfileById(this.userId);

    if (!profile) {
      throw new Error("Profile not found");
    }

    if (profile.capacity !== expectedCapacity) {
      throw new Error(
        `Expected capacity ${expectedCapacity}, got ${profile.capacity}`,
      );
    }

    return this;
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  override reset(): this {
    super.reset();
    this.expenseId = "";
    this.userGateway = new InMemoryUserGateway();
    return this;
  }
}

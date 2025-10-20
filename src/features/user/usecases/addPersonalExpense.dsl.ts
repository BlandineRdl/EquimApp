import { BaseDsl } from "../../../test/dsl";
import type {
  CreatePersonalExpenseDTO,
  PersonalExpense,
} from "../domain/personalExpense.model";
import { InMemoryUserGateway } from "../infra/inMemoryUser.gateway";
import type { UserGateway } from "../ports/UserGateway";

export class AddPersonalExpenseDSL extends BaseDsl<PersonalExpense> {
  private userGateway: UserGateway;
  private userId = "test-user-id";
  private expenseData: CreatePersonalExpenseDTO | null = null;

  constructor() {
    super();
    this.userGateway = new InMemoryUserGateway();
  }

  // ============================================================================
  // GIVEN - Setup initial state
  // ============================================================================

  givenUserExists(income = 2000): this {
    this.setupPromise = this._createUser(income);
    return this;
  }

  private async _createUser(income: number): Promise<void> {
    await this.userGateway.createProfile({
      id: this.userId,
      pseudo: "Test User",
      income,
      currency: "EUR",
      shareRevenue: true,
    });
  }

  givenValidExpense(label = "Rent", amount = 800): this {
    this.expenseData = { label, amount };
    return this;
  }

  givenInvalidExpenseLabel(label: string): this {
    this.expenseData = { label, amount: 800 };
    return this;
  }

  givenInvalidExpenseAmount(amount: number): this {
    this.expenseData = { label: "Rent", amount };
    return this;
  }

  // ============================================================================
  // WHEN - Execute the action
  // ============================================================================

  async whenAddingExpense(): Promise<this> {
    await this.executeAction(async () => {
      if (!this.expenseData) {
        throw new Error("Missing test setup: expenseData");
      }

      return await this.userGateway.addPersonalExpense(
        this.userId,
        this.expenseData,
      );
    });

    return this;
  }

  // ============================================================================
  // THEN - Assertions
  // ============================================================================

  thenExpenseShouldBeAdded(): this {
    if (!this.result) {
      throw new Error("Expected result but got null");
    }

    if (!this.result.id) {
      throw new Error("Expected expense to have an id");
    }

    if (!this.expenseData) {
      throw new Error("Missing expense data for comparison");
    }

    if (this.result.label !== this.expenseData.label) {
      throw new Error(
        `Expected label ${this.expenseData.label}, got ${this.result.label}`,
      );
    }

    if (this.result.amount !== this.expenseData.amount) {
      throw new Error(
        `Expected amount ${this.expenseData.amount}, got ${this.result.amount}`,
      );
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

  async thenUserShouldHaveExpenses(count: number): Promise<this> {
    const expenses = await this.userGateway.loadPersonalExpenses(this.userId);

    if (expenses.length !== count) {
      throw new Error(`Expected ${count} expenses, got ${expenses.length}`);
    }

    return this;
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  override reset(): this {
    super.reset();
    this.expenseData = null;
    this.userGateway = new InMemoryUserGateway();
    return this;
  }
}

import { BaseDsl } from "../../../test/dsl";
import type {
  PersonalExpense,
  UpdatePersonalExpenseDTO,
} from "../domain/personalExpense.model";
import { InMemoryUserGateway } from "../infra/inMemoryUser.gateway";
import type { UserGateway } from "../ports/UserGateway";

export class UpdatePersonalExpenseDSL extends BaseDsl<PersonalExpense> {
  private userGateway: UserGateway;
  private userId = "test-user-id";
  private expenseId = "";
  private updateData: UpdatePersonalExpenseDTO | null = null;

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
      label: "Original Label",
      amount: expenseAmount,
    });

    this.expenseId = expense.id;
  }

  givenValidUpdate(label = "Updated Label", amount = 900): this {
    this.updateData = {
      id: this.expenseId,
      label,
      amount,
    };
    return this;
  }

  givenInvalidLabel(label: string): this {
    this.updateData = {
      id: this.expenseId,
      label,
      amount: 900,
    };
    return this;
  }

  // ============================================================================
  // WHEN - Execute the action
  // ============================================================================

  async whenUpdatingExpense(): Promise<this> {
    await this.executeAction(async () => {
      if (!this.updateData) {
        throw new Error("Missing test setup: updateData");
      }

      return await this.userGateway.updatePersonalExpense(
        this.userId,
        this.updateData,
      );
    });

    return this;
  }

  // ============================================================================
  // THEN - Assertions
  // ============================================================================

  thenExpenseShouldBeUpdated(): this {
    if (!this.result) {
      throw new Error("Expected result but got null");
    }

    if (!this.updateData) {
      throw new Error("Missing update data for comparison");
    }

    if (this.result.label !== this.updateData.label) {
      throw new Error(
        `Expected label ${this.updateData.label}, got ${this.result.label}`,
      );
    }

    if (this.result.amount !== this.updateData.amount) {
      throw new Error(
        `Expected amount ${this.updateData.amount}, got ${this.result.amount}`,
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

  // ============================================================================
  // Helpers
  // ============================================================================

  override reset(): this {
    super.reset();
    this.expenseId = "";
    this.updateData = null;
    this.userGateway = new InMemoryUserGateway();
    return this;
  }
}

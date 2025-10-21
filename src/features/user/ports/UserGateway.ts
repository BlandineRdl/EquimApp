import type { PersonalExpense } from "../domain/manage-personal-expenses/personal-expense";
import type { User } from "../domain/manage-profile/profile";

/**
 * User Gateway Interface
 * Defines the contract for user profile operations
 */

// Gateway input types - represent what the gateway needs to perform operations

/** Data needed to create a new personal expense */
export type NewPersonalExpense = Omit<PersonalExpense, "id" | "userId">;

/** Data needed to update an existing personal expense */
export type PersonalExpenseUpdate = Omit<PersonalExpense, "userId">;

/** Data needed to create a new user profile */
export type CreateProfileInput = Omit<User, "personalExpenses" | "capacity">;

/** Data needed to update an existing user profile */
export interface UpdateProfileInput {
  pseudo?: string;
  monthlyIncome?: number;
  shareRevenue?: boolean;
}

export interface UserGateway {
  /**
   * Create a new user profile
   */
  createProfile(input: CreateProfileInput): Promise<void>;

  /**
   * Get profile by user ID
   * Returns null if not found or soft-deleted
   */
  getProfileById(id: string): Promise<User | null>;

  /**
   * Update user profile
   */
  updateProfile(id: string, patch: UpdateProfileInput): Promise<void>;

  /**
   * Add a personal expense for a user
   */
  addPersonalExpense(
    userId: string,
    expense: NewPersonalExpense,
  ): Promise<PersonalExpense>;

  /**
   * Update a personal expense
   */
  updatePersonalExpense(
    userId: string,
    expense: PersonalExpenseUpdate,
  ): Promise<PersonalExpense>;

  /**
   * Delete a personal expense
   */
  deletePersonalExpense(userId: string, expenseId: string): Promise<void>;

  /**
   * Load all personal expenses for a user
   */
  loadPersonalExpenses(userId: string): Promise<PersonalExpense[]>;

  /**
   * Get the calculated capacity for a user
   */
  getUserCapacity(userId: string): Promise<number | undefined>;
}

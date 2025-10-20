import type {
  CreatePersonalExpenseDTO,
  PersonalExpense,
  UpdatePersonalExpenseDTO,
} from "../domain/personalExpense.model";

/**
 * User Gateway Interface
 * Defines the contract for user profile operations
 */

export interface CreateProfileInput {
  id: string;
  pseudo: string;
  income: number;
  currency: string;
  shareRevenue: boolean;
}

export interface ProfileData {
  id: string;
  pseudo: string;
  income: number;
  shareRevenue: boolean;
  currency: string;
  createdAt: string;
  capacity?: number;
}

export interface UpdateProfileInput {
  pseudo?: string;
  income?: number;
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
  getProfileById(id: string): Promise<ProfileData | null>;

  /**
   * Update user profile
   */
  updateProfile(id: string, patch: UpdateProfileInput): Promise<void>;

  /**
   * Add a personal expense for a user
   */
  addPersonalExpense(
    userId: string,
    expense: CreatePersonalExpenseDTO,
  ): Promise<PersonalExpense>;

  /**
   * Update a personal expense
   */
  updatePersonalExpense(
    userId: string,
    expense: UpdatePersonalExpenseDTO,
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

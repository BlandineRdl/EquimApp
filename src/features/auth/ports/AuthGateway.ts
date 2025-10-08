import type { Session } from "@supabase/supabase-js";

/**
 * Authentication Gateway Interface
 * Defines the contract for authentication operations
 */
export interface AuthGateway {
  /**
   * Sign in with email (sends OTP code)
   */
  signInWithEmail(email: string): Promise<void>;

  /**
   * Verify OTP code received by email
   */
  verifyOtp(email: string, token: string): Promise<Session>;

  /**
   * Sign out current user
   */
  signOut(): Promise<void>;

  /**
   * Get current session
   */
  getSession(): Promise<Session | null>;

  /**
   * Subscribe to auth state changes
   * @returns Unsubscribe function
   */
  onAuthStateChange(callback: (session: Session | null) => void): {
    unsubscribe: () => void;
  };

  /**
   * Delete current user's account (soft delete)
   */
  deleteAccount(): Promise<void>;
}

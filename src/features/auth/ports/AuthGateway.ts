import type { Session } from "@supabase/supabase-js";

export interface AuthGateway {
  signInWithEmail(email: string): Promise<void>;

  verifyOtp(email: string, token: string): Promise<Session>;

  signOut(): Promise<void>;

  getSession(): Promise<Session | null>;

  onAuthStateChange(callback: (session: Session | null) => void): {
    unsubscribe: () => void;
  };

  deleteAccount(): Promise<void>;

  resetAccount(): Promise<void>;
}

import type { Session } from "@supabase/supabase-js";
import type { AuthGateway } from "../ports/AuthGateway";

export class InMemoryAuthGateway implements AuthGateway {
  private sessions = new Map<string, Session>();
  private currentSession: Session | null = null;
  private authStateListeners: ((session: Session | null) => void)[] = [];

  async signInWithEmail(email: string): Promise<void> {
    console.log(`[InMemory] OTP sent to ${email}`);
  }

  async verifyOtp(email: string, _token: string): Promise<Session> {
    const session: Session = {
      access_token: `mock-token-${email}`,
      refresh_token: `mock-refresh-${email}`,
      expires_in: 3600,
      expires_at: Date.now() / 1000 + 3600,
      token_type: "bearer",
      user: {
        id: `user-${email}`,
        email,
        aud: "authenticated",
        role: "authenticated",
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
      },
    };

    this.currentSession = session;
    this.sessions.set(email, session);

    this.notifyAuthStateChange(session);

    return session;
  }

  async signOut(): Promise<void> {
    this.currentSession = null;
    this.notifyAuthStateChange(null);
  }

  async getSession(): Promise<Session | null> {
    return this.currentSession;
  }

  onAuthStateChange(callback: (session: Session | null) => void): {
    unsubscribe: () => void;
  } {
    this.authStateListeners.push(callback);
    return {
      unsubscribe: () => {
        const index = this.authStateListeners.indexOf(callback);
        if (index > -1) {
          this.authStateListeners.splice(index, 1);
        }
      },
    };
  }

  async deleteAccount(): Promise<void> {
    this.currentSession = null;
    this.sessions.clear();
    this.notifyAuthStateChange(null);
  }

  async resetAccount(): Promise<void> {
    const session = this.currentSession;
    if (!session) {
      throw new Error("No user to reset");
    }

    console.log(`[InMemory] RESET account for user ${session.user.id}`);

    this.currentSession = null;

    for (const listener of this.authStateListeners) {
      listener(null);
    }
  }

  private notifyAuthStateChange(session: Session | null): void {
    for (const listener of this.authStateListeners) {
      listener(session);
    }
  }

  setCurrentSession(session: Session | null): void {
    this.currentSession = session;
  }
}

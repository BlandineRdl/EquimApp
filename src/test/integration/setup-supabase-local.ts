import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";

const SUPABASE_LOCAL_URL = "http://localhost:54321";
const SUPABASE_LOCAL_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export interface LocalSupabaseConfig {
  url: string;
  anonKey: string;
  testUserEmail: string;
  testUserPassword: string;
}

export const isSupabaseLocalAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${SUPABASE_LOCAL_URL}/rest/v1/`, {
      method: "HEAD",
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const shouldUseLocalSupabase = (): boolean => {
  return process.env.SUPABASE_USE_LOCAL === "true";
};

export const getSupabaseConfig = (): LocalSupabaseConfig => {
  const useLocal = shouldUseLocalSupabase();

  if (useLocal) {
    return {
      url: SUPABASE_LOCAL_URL,
      anonKey: SUPABASE_LOCAL_ANON_KEY,
      testUserEmail: "test@example.com",
      testUserPassword: "test-password-123",
    };
  }

  const url = process.env.SUPABASE_TEST_URL;
  const anonKey = process.env.SUPABASE_TEST_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase configuration. Set SUPABASE_USE_LOCAL=true or provide SUPABASE_TEST_URL and SUPABASE_TEST_ANON_KEY",
    );
  }

  return {
    url,
    anonKey,
    testUserEmail: process.env.SUPABASE_TEST_USER_EMAIL || "test@example.com",
    testUserPassword:
      process.env.SUPABASE_TEST_USER_PASSWORD || "test-password-123",
  };
};

export const createLocalTestClient = (
  config?: LocalSupabaseConfig,
): SupabaseClient<Database> => {
  const testConfig = config || getSupabaseConfig();

  return createClient<Database>(testConfig.url, testConfig.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
};

export const resetTestDatabase = async (
  client: SupabaseClient<Database>,
): Promise<void> => {
  await client
    .from("group_members")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  await client
    .from("expenses")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  await client
    .from("invitations")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  await client
    .from("groups")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
};

export const createTestUser = async (
  client: SupabaseClient<Database>,
  email: string,
  password: string,
): Promise<{ userId: string; email: string }> => {
  const { data, error } = await client.auth.signUp({
    email,
    password,
  });

  if (error) {
    const { data: signInData, error: signInError } =
      await client.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      throw new Error(
        `Failed to create or sign in test user: ${signInError.message}`,
      );
    }

    if (!signInData.user?.id || !signInData.user?.email) {
      throw new Error("Failed to get user data after sign in");
    }

    return {
      userId: signInData.user.id,
      email: signInData.user.email,
    };
  }

  if (!data.user?.id || !data.user?.email) {
    throw new Error("Failed to get user data after sign up");
  }

  return {
    userId: data.user.id,
    email: data.user.email,
  };
};

export class LocalSupabaseTestHelper {
  private client: SupabaseClient<Database>;
  private config: LocalSupabaseConfig;
  private createdGroupIds: string[] = [];
  private createdProfileIds: string[] = [];

  constructor(client: SupabaseClient<Database>, config: LocalSupabaseConfig) {
    this.client = client;
    this.config = config;
  }

  trackGroup(groupId: string): void {
    this.createdGroupIds.push(groupId);
  }

  trackProfile(profileId: string): void {
    this.createdProfileIds.push(profileId);
  }

  async cleanup(): Promise<void> {
    for (const groupId of this.createdGroupIds) {
      await this.client.from("groups").delete().eq("id", groupId);
    }

    for (const profileId of this.createdProfileIds) {
      await this.client.from("profiles").delete().eq("id", profileId);
    }

    this.createdGroupIds = [];
    this.createdProfileIds = [];
  }

  async getCurrentUser() {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    return user;
  }

  async signInTestUser(email?: string, password?: string): Promise<void> {
    const testEmail = email || this.config.testUserEmail;
    const testPassword = password || this.config.testUserPassword;

    await createTestUser(this.client, testEmail, testPassword);
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  async resetDatabase(): Promise<void> {
    await resetTestDatabase(this.client);
  }
}

export const setupLocalSupabaseTest = async (): Promise<{
  client: SupabaseClient<Database>;
  helper: LocalSupabaseTestHelper;
  config: LocalSupabaseConfig;
}> => {
  const config = getSupabaseConfig();
  const client = createLocalTestClient(config);
  const helper = new LocalSupabaseTestHelper(client, config);

  if (shouldUseLocalSupabase()) {
    const isAvailable = await isSupabaseLocalAvailable();
    if (!isAvailable) {
      throw new Error(
        "Supabase local is not running. Run 'supabase start' first.",
      );
    }
  }

  await helper.resetDatabase();

  try {
    await helper.signInTestUser();
  } catch (error) {
    console.warn("Could not sign in test user:", (error as Error).message);
  }

  return { client, helper, config };
};

export const cleanupLocalSupabaseTest = async (
  helper: LocalSupabaseTestHelper,
): Promise<void> => {
  await helper.cleanup();
  await helper.signOut();
};

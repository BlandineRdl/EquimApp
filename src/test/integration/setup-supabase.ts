import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";

export interface SupabaseTestConfig {
  url: string;
  anonKey: string;
  testUserEmail?: string;
  testUserPassword?: string;
}

export const shouldSkipIntegrationTests = (): boolean => {
  return (
    process.env.SKIP_INTEGRATION_TESTS === "true" ||
    !process.env.SUPABASE_TEST_URL ||
    !process.env.SUPABASE_TEST_ANON_KEY
  );
};

export const getTestConfig = (): SupabaseTestConfig => {
  const url = process.env.SUPABASE_TEST_URL;
  const anonKey = process.env.SUPABASE_TEST_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase test configuration. Set SUPABASE_TEST_URL and SUPABASE_TEST_ANON_KEY in .env.test",
    );
  }

  return {
    url,
    anonKey,
    testUserEmail: process.env.SUPABASE_TEST_USER_EMAIL,
    testUserPassword: process.env.SUPABASE_TEST_USER_PASSWORD,
  };
};

export const createTestClient = (
  config?: SupabaseTestConfig,
): SupabaseClient<Database> => {
  const testConfig = config || getTestConfig();

  return createClient<Database>(testConfig.url, testConfig.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
};

export class SupabaseTestHelper {
  private client: SupabaseClient<Database>;
  private createdGroupIds: string[] = [];
  private createdProfileIds: string[] = [];

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
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
    const config = getTestConfig();
    const testEmail = email || config.testUserEmail;
    const testPassword = password || config.testUserPassword;

    if (!testEmail || !testPassword) {
      throw new Error(
        "Test user credentials not configured. Set SUPABASE_TEST_USER_EMAIL and SUPABASE_TEST_USER_PASSWORD",
      );
    }

    const { error } = await this.client.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      throw new Error(`Failed to sign in test user: ${error.message}`);
    }
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }
}

export const setupSupabaseTest = async (): Promise<{
  client: SupabaseClient<Database>;
  helper: SupabaseTestHelper;
}> => {
  if (shouldSkipIntegrationTests()) {
    throw new Error("Integration tests are disabled");
  }

  const client = createTestClient();
  const helper = new SupabaseTestHelper(client);

  try {
    await helper.signInTestUser();
  } catch (error) {
    console.warn("Could not sign in test user:", (error as Error).message);
  }

  return { client, helper };
};

export const cleanupSupabaseTest = async (
  helper: SupabaseTestHelper,
): Promise<void> => {
  await helper.cleanup();
  await helper.signOut();
};

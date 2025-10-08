/**
 * Supabase Integration Test Setup
 *
 * This file provides utilities for running integration tests against Supabase.
 *
 * IMPORTANT: Integration tests require:
 * 1. A test Supabase project (separate from production)
 * 2. Environment variables: SUPABASE_TEST_URL and SUPABASE_TEST_ANON_KEY
 * 3. Test user credentials for authentication
 *
 * Usage:
 * - Set SKIP_INTEGRATION_TESTS=true to skip integration tests
 * - Use setupSupabaseTest() in beforeAll() to initialize test client
 * - Use cleanupSupabaseTest() in afterAll() to cleanup
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";

export interface SupabaseTestConfig {
  url: string;
  anonKey: string;
  testUserEmail?: string;
  testUserPassword?: string;
}

// Check if integration tests should be skipped
export const shouldSkipIntegrationTests = (): boolean => {
  return (
    process.env.SKIP_INTEGRATION_TESTS === "true" ||
    !process.env.SUPABASE_TEST_URL ||
    !process.env.SUPABASE_TEST_ANON_KEY
  );
};

// Get test configuration from environment
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

// Create a test Supabase client
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

// Test data cleanup helper
export class SupabaseTestHelper {
  private client: SupabaseClient<Database>;
  private createdGroupIds: string[] = [];
  private createdProfileIds: string[] = [];

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  /**
   * Track a group for cleanup
   */
  trackGroup(groupId: string): void {
    this.createdGroupIds.push(groupId);
  }

  /**
   * Track a profile for cleanup
   */
  trackProfile(profileId: string): void {
    this.createdProfileIds.push(profileId);
  }

  /**
   * Clean up all created test data
   */
  async cleanup(): Promise<void> {
    // Delete groups (cascades to members and expenses)
    for (const groupId of this.createdGroupIds) {
      await this.client.from("groups").delete().eq("id", groupId);
    }

    // Delete profiles
    for (const profileId of this.createdProfileIds) {
      await this.client.from("profiles").delete().eq("id", profileId);
    }

    this.createdGroupIds = [];
    this.createdProfileIds = [];
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    return user;
  }

  /**
   * Sign in with test user credentials
   */
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

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }
}

/**
 * Setup function for integration tests
 */
export const setupSupabaseTest = async (): Promise<{
  client: SupabaseClient<Database>;
  helper: SupabaseTestHelper;
}> => {
  if (shouldSkipIntegrationTests()) {
    throw new Error("Integration tests are disabled");
  }

  const client = createTestClient();
  const helper = new SupabaseTestHelper(client);

  // Sign in test user if credentials are available
  try {
    await helper.signInTestUser();
  } catch (error) {
    console.warn("Could not sign in test user:", (error as Error).message);
  }

  return { client, helper };
};

/**
 * Cleanup function for integration tests
 */
export const cleanupSupabaseTest = async (
  helper: SupabaseTestHelper,
): Promise<void> => {
  await helper.cleanup();
  await helper.signOut();
};

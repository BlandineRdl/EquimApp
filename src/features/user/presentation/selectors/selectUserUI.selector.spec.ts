/**
 * View model generation for User UI
 * Tests the selectUserUI selector with Redux store
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { ReduxStore } from "../../../../store/buildReduxStore";
import { initReduxStore } from "../../../../store/buildReduxStore";
import { InMemoryUserGateway } from "../../infra/InMemoryUserGateway";
import { selectUserUI } from "./selectUser.selector";

describe("View model generation for User UI", () => {
  let store: ReduxStore;
  let userGateway: InMemoryUserGateway;
  const userId = "test-user-123";

  beforeEach(async () => {
    userGateway = new InMemoryUserGateway();
    await userGateway.createProfile({
      id: userId,
      pseudo: "TestUser",
      monthlyIncome: 2000,
      currency: "EUR",
      shareRevenue: true,
    });

    store = initReduxStore({
      userGateway,
    }) as ReduxStore;

    // Simulate auth state
    store.dispatch({
      type: "auth/signIn/fulfilled",
      payload: { userId },
    });
  });

  it("should show no profile loaded initially", () => {
    const userUI = selectUserUI(store.getState());

    expect(userUI).toEqual({
      profile: null,
      loading: false,
      error: null,
      isLoaded: false,
      pseudo: null,
      monthlyIncome: 0,
      hasProfile: false,
    });
  });

  it("should show loading state when loading profile", () => {
    store.dispatch({
      type: "user/loadProfile/pending",
    });

    const userUI = selectUserUI(store.getState());

    expect(userUI.loading).toBe(true);
    expect(userUI.isLoaded).toBe(false);
  });

  it("should show profile loaded with correct data", () => {
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [],
        capacity: 2000,
      },
    });

    const userUI = selectUserUI(store.getState());

    expect(userUI).toEqual({
      profile: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [],
        capacity: 2000,
      },
      loading: false,
      error: null,
      isLoaded: true,
      pseudo: "TestUser",
      monthlyIncome: 2000,
      hasProfile: true,
    });
  });

  it("should show error when profile loading fails", () => {
    store.dispatch({
      type: "user/loadProfile/rejected",
      error: { message: "Network error" },
    });

    const userUI = selectUserUI(store.getState());

    expect(userUI.error?.message).toBe("Network error");
    expect(userUI.loading).toBe(false);
    expect(userUI.hasProfile).toBe(false);
  });

  it("should update monthlyIncome optimistically", () => {
    // First load profile
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [],
        capacity: 2000,
      },
    });

    // Then update income (pending = optimistic update)
    store.dispatch({
      type: "user/updateIncome/pending",
      meta: {
        arg: {
          userId,
          newIncome: 2500,
        },
      },
    });

    const userUI = selectUserUI(store.getState());

    expect(userUI.monthlyIncome).toBe(2500);
    expect(userUI.profile?.monthlyIncome).toBe(2500);
  });

  it("should rollback income on update failure", () => {
    // Load profile
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [],
        capacity: 2000,
      },
    });

    // Optimistic update
    store.dispatch({
      type: "user/updateIncome/pending",
      meta: {
        arg: {
          userId,
          newIncome: 2500,
        },
      },
    });

    // Update fails - should rollback
    store.dispatch({
      type: "user/updateIncome/rejected",
      error: { message: "Failed to update" },
    });

    const userUI = selectUserUI(store.getState());

    expect(userUI.monthlyIncome).toBe(2000); // Rolled back
    expect(userUI.error?.message).toBe("Failed to update");
  });

  it("should show profile after onboarding completion", () => {
    // Step 1: Complete onboarding (creates profile but doesn't set it in state)
    store.dispatch({
      type: "onboarding/complete/fulfilled",
      payload: {
        profileId: userId,
        profile: {
          pseudo: "NewUser",
          income: 1500,
        },
      },
    });

    // At this point, profile is not yet loaded
    let userUI = selectUserUI(store.getState());
    expect(userUI.hasProfile).toBe(false);

    // Step 2: Load the profile (as would happen in the app)
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "NewUser",
        monthlyIncome: 1500,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [],
        capacity: 1500,
      },
    });

    // Now the profile should be loaded
    userUI = selectUserUI(store.getState());
    expect(userUI.hasProfile).toBe(true);
    expect(userUI.pseudo).toBe("NewUser");
    expect(userUI.monthlyIncome).toBe(1500);
  });

  it("should clear profile on sign out", () => {
    // Load profile
    store.dispatch({
      type: "user/loadProfile/fulfilled",
      payload: {
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        shareRevenue: true,
        currency: "EUR",
        personalExpenses: [],
        capacity: 2000,
      },
    });

    // Sign out
    store.dispatch({
      type: "auth/signOut/fulfilled",
    });

    const userUI = selectUserUI(store.getState());

    expect(userUI).toEqual({
      profile: null,
      loading: false,
      error: null,
      isLoaded: false,
      pseudo: null,
      monthlyIncome: 0,
      hasProfile: false,
    });
  });
});

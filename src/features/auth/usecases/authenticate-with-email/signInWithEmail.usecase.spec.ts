import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../../store/buildReduxStore";
import { InMemoryAuthGateway } from "../../infra/InMemoryAuthGateway";
import { signInWithEmail } from "./signInWithEmail.usecase";

describe("Feature: Sign in with email", () => {
  let store: ReduxStore;

  beforeEach(() => {
    const authGateway = new InMemoryAuthGateway();
    store = initReduxStore({ authGateway });
  });

  describe("Success scenarios", () => {
    it("should send OTP to valid email", async () => {
      const email = "user@example.com";

      await store.dispatch(signInWithEmail(email));

      const state = store.getState();
      expect(state.auth.isLoading).toBe(false);
      expect(state.auth.error).toBeNull();
    });

    it("should normalize email to lowercase", async () => {
      const email = "User@Example.COM";

      await store.dispatch(signInWithEmail(email));

      const state = store.getState();
      expect(state.auth.isLoading).toBe(false);
      expect(state.auth.error).toBeNull();
    });

    it("should trim whitespace from email", async () => {
      const email = "  user@example.com  ";

      await store.dispatch(signInWithEmail(email));

      const state = store.getState();
      expect(state.auth.isLoading).toBe(false);
      expect(state.auth.error).toBeNull();
    });
  });

  describe("Validation failures", () => {
    it("should reject email without @", async () => {
      const email = "userexample.com";

      await store.dispatch(signInWithEmail(email));

      const state = store.getState();
      expect(state.auth.error?.message).toContain("valid email");
    });

    it("should reject email without domain", async () => {
      const email = "user@";

      await store.dispatch(signInWithEmail(email));

      const state = store.getState();
      expect(state.auth.error?.message).toContain("valid email");
    });

    it("should reject email without local part", async () => {
      const email = "@example.com";

      await store.dispatch(signInWithEmail(email));

      const state = store.getState();
      expect(state.auth.error?.message).toContain("valid email");
    });

    it("should reject empty email", async () => {
      const email = "";

      await store.dispatch(signInWithEmail(email));

      const state = store.getState();
      expect(state.auth.error?.message).toContain("valid email");
    });

    it("should reject whitespace-only email", async () => {
      const email = "   ";

      await store.dispatch(signInWithEmail(email));

      const state = store.getState();
      expect(state.auth.error?.message).toContain("valid email");
    });

    it("should reject email with spaces", async () => {
      const email = "user name@example.com";

      await store.dispatch(signInWithEmail(email));

      const state = store.getState();
      expect(state.auth.error?.message).toContain("valid email");
    });
  });
});

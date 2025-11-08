import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../../store/buildReduxStore";
import type { AppError } from "../../../../types/thunk.types";
import { InMemoryAuthGateway } from "../../../auth/infra/InMemoryAuthGateway";
import { InMemoryUserGateway } from "../../../user/infra/InMemoryUserGateway";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import { createGroup } from "./createGroup.usecase";

describe("Feature: Create group", () => {
  let store: ReduxStore;
  let groupGateway: InMemoryGroupGateway;
  let authGateway: InMemoryAuthGateway;
  let userGateway: InMemoryUserGateway;

  beforeEach(() => {
    groupGateway = new InMemoryGroupGateway();
    authGateway = new InMemoryAuthGateway();
    userGateway = new InMemoryUserGateway();
    store = initReduxStore({ groupGateway, authGateway, userGateway });
  });

  describe("Success scenarios", () => {
    it("should create group with valid name", async () => {
      const name = "Ma Coloc";

      const result = await store.dispatch(createGroup({ name }));

      expect(result.type).toBe("groups/createGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const group = result.payload as { groupId: string };
        expect(group.groupId).toBeDefined();
      }
    });

    it("should trim whitespace from group name", async () => {
      const name = "  Mon Groupe  ";

      const result = await store.dispatch(createGroup({ name }));

      expect(result.type).toBe("groups/createGroup/fulfilled");
    });

    it("should use default EUR currency when not specified", async () => {
      const name = "Test Group";

      const result = await store.dispatch(createGroup({ name }));

      expect(result.type).toBe("groups/createGroup/fulfilled");
    });

    it("should accept custom currency", async () => {
      const name = "US Group";
      const currency = "USD";

      const result = await store.dispatch(createGroup({ name, currency }));

      expect(result.type).toBe("groups/createGroup/fulfilled");
    });
  });

  describe("Validation failures", () => {
    it("should reject empty group name", async () => {
      const name = "";

      const result = await store.dispatch(createGroup({ name }));

      expect(result.type).toBe("groups/createGroup/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("vide");
      }
    });

    it("should reject whitespace-only group name", async () => {
      const name = "   ";

      const result = await store.dispatch(createGroup({ name }));

      expect(result.type).toBe("groups/createGroup/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("vide");
      }
    });

    it("should reject group name shorter than 2 characters", async () => {
      const name = "A";

      const result = await store.dispatch(createGroup({ name }));

      expect(result.type).toBe("groups/createGroup/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("2 caractères");
      }
    });

    it("should reject group name longer than 50 characters", async () => {
      const name = "A".repeat(51);

      const result = await store.dispatch(createGroup({ name }));

      expect(result.type).toBe("groups/createGroup/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("50 caractères");
      }
    });
  });
});

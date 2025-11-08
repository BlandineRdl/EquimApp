import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../../store/buildReduxStore";
import type { AppError } from "../../../../types/thunk.types";
import { InMemoryAuthGateway } from "../../../auth/infra/InMemoryAuthGateway";
import { InMemoryUserGateway } from "../../../user/infra/InMemoryUserGateway";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import { loadGroupById } from "../load-group/loadGroup.usecase";
import { addMemberToGroup } from "./addMember.usecase";

describe("Feature: Add member to group", () => {
  let store: ReduxStore;
  let groupGateway: InMemoryGroupGateway;
  let authGateway: InMemoryAuthGateway;
  let userGateway: InMemoryUserGateway;
  const userId = "test-user-id";

  beforeEach(() => {
    groupGateway = new InMemoryGroupGateway();
    authGateway = new InMemoryAuthGateway();
    userGateway = new InMemoryUserGateway();
    store = initReduxStore({ groupGateway, authGateway, userGateway });
  });

  describe("Success scenarios", () => {
    it("should add phantom member with valid data", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addMemberToGroup({
          groupId,
          memberData: {
            pseudo: "PhantomUser",
            monthlyIncome: 2000,
          },
        }),
      );

      expect(result.type).toBe("groups/addMemberToGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as {
          groupId: string;
          newMember: {
            id: string;
            pseudo: string;
            incomeOrWeight: number;
            isPhantom: boolean;
          };
          shares: { totalExpenses: number };
        };
        expect(response.groupId).toBe(groupId);
        expect(response.newMember.pseudo).toBe("Membre-PhantomUser");
        expect(response.newMember.incomeOrWeight).toBe(2000);
        expect(response.newMember.isPhantom).toBe(true);
        expect(response.newMember.id).toBeDefined();
        expect(response.shares).toBeDefined();
      }

      const state = store.getState();
      const group = state.groups.entities[groupId];
      expect(group).toBeDefined();
      expect(group?.members.length).toBeGreaterThan(0);
    });

    it("should trim whitespace from pseudo", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addMemberToGroup({
          groupId,
          memberData: {
            pseudo: "  SpacedUser  ",
            monthlyIncome: 2000,
          },
        }),
      );

      expect(result.type).toBe("groups/addMemberToGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as { newMember: { pseudo: string } };
        expect(response.newMember.pseudo).toBe("Membre-SpacedUser");
      }
    });

    it("should recalculate shares after adding member", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);
      await groupGateway.createExpense({
        groupId,
        name: "Loyer",
        amount: 1200,
        currency: "EUR",
        isPredefined: false,
      });

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addMemberToGroup({
          groupId,
          memberData: {
            pseudo: "NewMember",
            monthlyIncome: 1800,
          },
        }),
      );

      expect(result.type).toBe("groups/addMemberToGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as {
          shares: { shares: unknown[]; totalExpenses: number };
        };
        expect(response.shares.shares).toBeDefined();
        expect(response.shares.shares.length).toBeGreaterThan(0);
        expect(response.shares.totalExpenses).toBe(1200);
      }
    });

    it("should set phantom member capacity equal to income", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addMemberToGroup({
          groupId,
          memberData: {
            pseudo: "Phantom",
            monthlyIncome: 2500,
          },
        }),
      );

      expect(result.type).toBe("groups/addMemberToGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as {
          newMember: { monthlyCapacity: number; incomeOrWeight: number };
        };
        expect(response.newMember.monthlyCapacity).toBe(2500);
        expect(response.newMember.incomeOrWeight).toBe(2500);
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject when group does not exist in state", async () => {
      const result = await store.dispatch(
        addMemberToGroup({
          groupId: "non-existent-group",
          memberData: {
            pseudo: "TestUser",
            monthlyIncome: 2000,
          },
        }),
      );

      expect(result.type).toBe("groups/addMemberToGroup/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("non trouvé");
      }
    });

    it("should reject empty pseudo", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addMemberToGroup({
          groupId,
          memberData: {
            pseudo: "",
            monthlyIncome: 2000,
          },
        }),
      );

      expect(result.type).toBe("groups/addMemberToGroup/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("1 et 50 caractères");
      }
    });

    it("should reject whitespace-only pseudo", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addMemberToGroup({
          groupId,
          memberData: {
            pseudo: "   ",
            monthlyIncome: 2000,
          },
        }),
      );

      expect(result.type).toBe("groups/addMemberToGroup/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("1 et 50 caractères");
      }
    });

    it("should allow single character pseudo", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addMemberToGroup({
          groupId,
          memberData: {
            pseudo: "A",
            monthlyIncome: 2000,
          },
        }),
      );

      expect(result.type).toBe("groups/addMemberToGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as { newMember: { pseudo: string } };
        expect(response.newMember.pseudo).toBe("Membre-A");
      }
    });

    it("should allow zero monthly income", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addMemberToGroup({
          groupId,
          memberData: {
            pseudo: "TestUser",
            monthlyIncome: 0,
          },
        }),
      );

      expect(result.type).toBe("groups/addMemberToGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as {
          newMember: { incomeOrWeight: number };
        };
        expect(response.newMember.incomeOrWeight).toBe(0);
      }
    });

    it("should reject negative monthly income", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addMemberToGroup({
          groupId,
          memberData: {
            pseudo: "TestUser",
            monthlyIncome: -1000,
          },
        }),
      );

      expect(result.type).toBe("groups/addMemberToGroup/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("négatif");
      }
    });
  });

  describe("Business rules", () => {
    it("should mark member as phantom", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addMemberToGroup({
          groupId,
          memberData: {
            pseudo: "PhantomMember",
            monthlyIncome: 2000,
          },
        }),
      );

      expect(result.type).toBe("groups/addMemberToGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as {
          newMember: { isPhantom: boolean; userId: null };
        };
        expect(response.newMember.isPhantom).toBe(true);
        expect(response.newMember.userId).toBeNull();
      }
    });

    it("should set shareRevenue to true for phantom members", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        addMemberToGroup({
          groupId,
          memberData: {
            pseudo: "TestMember",
            monthlyIncome: 1500,
          },
        }),
      );

      expect(result.type).toBe("groups/addMemberToGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as {
          newMember: { shareRevenue: boolean };
        };
        expect(response.newMember.shareRevenue).toBe(true);
      }
    });
  });
});

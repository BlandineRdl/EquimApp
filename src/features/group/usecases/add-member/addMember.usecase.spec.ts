/**
 * Feature: Add member to group
 * En tant que membre d'un groupe,
 * Je veux ajouter un membre fantôme,
 * Afin de partager les dépenses avec une personne qui n'a pas l'app.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { MIN_PSEUDO_LENGTH } from "../../domain/manage-members/member.constants";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import type { GroupGateway } from "../../ports/GroupGateway";
import { addMemberToGroup } from "./addMember.usecase";

describe("Feature: Add member to group", () => {
  let groupGateway: InMemoryGroupGateway;
  const userId = "test-user-id";

  beforeEach(() => {
    groupGateway = new InMemoryGroupGateway();
  });

  describe("Success scenarios", () => {
    it("should add phantom member with valid data", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      // Get actual group for state
      const actualGroup = await groupGateway.getGroupById(groupId);
      const mockState = {
        groups: {
          entities: {
            [groupId]: {
              ...actualGroup,
              totalMonthlyBudget: actualGroup.shares.totalExpenses,
            },
          },
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on ajoute un membre fantôme
      const action = addMemberToGroup({
        groupId,
        memberData: {
          pseudo: "PhantomUser",
          monthlyIncome: 2000,
        },
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then l'ajout réussit
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
        expect(response.newMember.pseudo).toBe("PhantomUser");
        expect(response.newMember.incomeOrWeight).toBe(2000);
        expect(response.newMember.isPhantom).toBe(true);
        expect(response.newMember.id).toBeDefined();
        expect(response.shares).toBeDefined();
      }
    });

    it("should trim whitespace from pseudo", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      const actualGroup = await groupGateway.getGroupById(groupId);
      const mockState = {
        groups: {
          entities: {
            [groupId]: {
              ...actualGroup,
              totalMonthlyBudget: actualGroup.shares.totalExpenses,
            },
          },
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on ajoute un membre avec des espaces
      const action = addMemberToGroup({
        groupId,
        memberData: {
          pseudo: "  SpacedUser  ",
          monthlyIncome: 2000,
        },
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then le pseudo est trimmed
      expect(result.type).toBe("groups/addMemberToGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as { newMember: { pseudo: string } };
        expect(response.newMember.pseudo).toBe("SpacedUser");
      }
    });

    it("should recalculate shares after adding member", async () => {
      // Given un groupe avec des dépenses
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

      const actualGroup = await groupGateway.getGroupById(groupId);
      const mockState = {
        groups: {
          entities: {
            [groupId]: {
              ...actualGroup,
              totalMonthlyBudget: actualGroup.shares.totalExpenses,
            },
          },
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on ajoute un membre
      const action = addMemberToGroup({
        groupId,
        memberData: {
          pseudo: "NewMember",
          monthlyIncome: 1800,
        },
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then les parts sont recalculées
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
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      const actualGroup = await groupGateway.getGroupById(groupId);
      const mockState = {
        groups: {
          entities: {
            [groupId]: {
              ...actualGroup,
              totalMonthlyBudget: actualGroup.shares.totalExpenses,
            },
          },
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on ajoute un membre fantôme
      const action = addMemberToGroup({
        groupId,
        memberData: {
          pseudo: "Phantom",
          monthlyIncome: 2500,
        },
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then la capacité égale le revenu (pas de dépenses personnelles)
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
      // Given un groupe qui n'existe pas
      const mockState = {
        groups: {
          entities: {},
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on essaie d'ajouter un membre
      const action = addMemberToGroup({
        groupId: "non-existent-group",
        memberData: {
          pseudo: "TestUser",
          monthlyIncome: 2000,
        },
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then l'ajout échoue
      expect(result.type).toBe("groups/addMemberToGroup/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("non trouvé");
      }
    });

    it("should reject empty pseudo", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      const actualGroup = await groupGateway.getGroupById(groupId);
      const mockState = {
        groups: {
          entities: {
            [groupId]: {
              ...actualGroup,
              totalMonthlyBudget: actualGroup.shares.totalExpenses,
            },
          },
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on essaie d'ajouter un membre avec un pseudo vide
      const action = addMemberToGroup({
        groupId,
        memberData: {
          pseudo: "",
          monthlyIncome: 2000,
        },
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then l'ajout échoue
      expect(result.type).toBe("groups/addMemberToGroup/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("vide");
      }
    });

    it("should reject whitespace-only pseudo", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      const actualGroup = await groupGateway.getGroupById(groupId);
      const mockState = {
        groups: {
          entities: {
            [groupId]: {
              ...actualGroup,
              totalMonthlyBudget: actualGroup.shares.totalExpenses,
            },
          },
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on essaie d'ajouter un membre avec seulement des espaces
      const action = addMemberToGroup({
        groupId,
        memberData: {
          pseudo: "   ",
          monthlyIncome: 2000,
        },
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then l'ajout échoue
      expect(result.type).toBe("groups/addMemberToGroup/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("vide");
      }
    });

    it(`should reject pseudo shorter than ${MIN_PSEUDO_LENGTH} characters`, async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      const actualGroup = await groupGateway.getGroupById(groupId);
      const mockState = {
        groups: {
          entities: {
            [groupId]: {
              ...actualGroup,
              totalMonthlyBudget: actualGroup.shares.totalExpenses,
            },
          },
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on essaie d'ajouter un membre avec un pseudo trop court
      const action = addMemberToGroup({
        groupId,
        memberData: {
          pseudo: "A",
          monthlyIncome: 2000,
        },
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then l'ajout échoue
      expect(result.type).toBe("groups/addMemberToGroup/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("caractères");
      }
    });

    it("should reject zero monthly income", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      const actualGroup = await groupGateway.getGroupById(groupId);
      const mockState = {
        groups: {
          entities: {
            [groupId]: {
              ...actualGroup,
              totalMonthlyBudget: actualGroup.shares.totalExpenses,
            },
          },
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on essaie d'ajouter un membre avec un revenu de 0
      const action = addMemberToGroup({
        groupId,
        memberData: {
          pseudo: "TestUser",
          monthlyIncome: 0,
        },
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then l'ajout échoue
      expect(result.type).toBe("groups/addMemberToGroup/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("positif");
      }
    });

    it("should reject negative monthly income", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      const actualGroup = await groupGateway.getGroupById(groupId);
      const mockState = {
        groups: {
          entities: {
            [groupId]: {
              ...actualGroup,
              totalMonthlyBudget: actualGroup.shares.totalExpenses,
            },
          },
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on essaie d'ajouter un membre avec un revenu négatif
      const action = addMemberToGroup({
        groupId,
        memberData: {
          pseudo: "TestUser",
          monthlyIncome: -1000,
        },
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then l'ajout échoue
      expect(result.type).toBe("groups/addMemberToGroup/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("positif");
      }
    });
  });

  describe("Business rules", () => {
    it("should mark member as phantom", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      const actualGroup = await groupGateway.getGroupById(groupId);
      const mockState = {
        groups: {
          entities: {
            [groupId]: {
              ...actualGroup,
              totalMonthlyBudget: actualGroup.shares.totalExpenses,
            },
          },
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on ajoute un membre
      const action = addMemberToGroup({
        groupId,
        memberData: {
          pseudo: "PhantomMember",
          monthlyIncome: 2000,
        },
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then le membre est marqué comme fantôme
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
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      const actualGroup = await groupGateway.getGroupById(groupId);
      const mockState = {
        groups: {
          entities: {
            [groupId]: {
              ...actualGroup,
              totalMonthlyBudget: actualGroup.shares.totalExpenses,
            },
          },
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on ajoute un membre
      const action = addMemberToGroup({
        groupId,
        memberData: {
          pseudo: "TestMember",
          monthlyIncome: 1500,
        },
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then shareRevenue est true
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

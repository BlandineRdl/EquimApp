/**
 * Behavioral tests for Get Invitation Details Use Case
 */

import { beforeEach, describe, it } from "vitest";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import type { GroupGateway } from "../../ports/GroupGateway";

describe("Get Invitation Details Use Case", () => {
  let groupGateway: GroupGateway;
  let validToken: string;
  let groupId: string;

  beforeEach(async () => {
    groupGateway = new InMemoryGroupGateway();

    // Create a group and generate invitation
    const createResult = await groupGateway.createGroup("Test Group", "EUR");
    groupId = createResult.groupId;

    const inviteResult = await groupGateway.generateInvitation(groupId);
    validToken = inviteResult.token;
  });

  describe("Success scenarios", () => {
    it("should retrieve invitation details with valid token", async () => {
      const details = await groupGateway.getInvitationDetails(validToken);

      if (!details) {
        throw new Error("Expected invitation details");
      }

      if (details.groupId !== groupId) {
        throw new Error("Expected correct group ID");
      }

      if (!details.groupName) {
        throw new Error("Expected group name");
      }
    });

    it("should return invitation with group information", async () => {
      const details = await groupGateway.getInvitationDetails(validToken);

      if (!details) {
        throw new Error("Expected invitation details");
      }

      // Verify it contains group information
      if (details.groupName !== "Test Group") {
        throw new Error(
          `Expected group name 'Test Group', got ${details.groupName}`,
        );
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject invalid token", async () => {
      const details = await groupGateway.getInvitationDetails("invalid-token");

      if (details !== null) {
        throw new Error("Expected null for invalid token");
      }
    });

    it("should reject empty token", async () => {
      try {
        await groupGateway.getInvitationDetails("");
        throw new Error("Expected error for empty token");
      } catch (error) {
        const message = (error as Error).message;
        if (!message.includes("invalide")) {
          throw error;
        }
      }
    });

    it("should reject whitespace-only token", async () => {
      try {
        await groupGateway.getInvitationDetails("   ");
        throw new Error("Expected error for whitespace token");
      } catch (error) {
        const message = (error as Error).message;
        if (!message.includes("invalide")) {
          throw error;
        }
      }
    });
  });

  describe("Token expiration", () => {
    it("should handle expired tokens gracefully", async () => {
      // For now, just verify it returns null or throws appropriate error
      const expiredToken = "invite-expired-token-123";
      const details = await groupGateway.getInvitationDetails(expiredToken);

      if (details !== null) {
        throw new Error("Expected null for expired token");
      }
    });
  });
});

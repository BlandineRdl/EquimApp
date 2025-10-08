/**
 * Behavioral tests for Generate Invite Link Use Case
 * Using DSL pattern for readability
 */

import { describe, it, beforeEach } from "vitest";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import type { GroupGateway } from "../../ports/GroupGateway";

describe("Generate Invite Link Use Case", () => {
  let groupGateway: GroupGateway;
  let groupId: string;

  beforeEach(async () => {
    groupGateway = new InMemoryGroupGateway();
    const result = await groupGateway.createGroup("Test Group", "EUR");
    groupId = result.groupId;
  });

  describe("Success scenarios", () => {
    it("should generate invitation link for existing group", async () => {
      const result = await groupGateway.generateInvitation(groupId);

      if (!result.link) {
        throw new Error("Expected invitation link");
      }

      if (!result.token) {
        throw new Error("Expected invitation token");
      }

      // Link should contain the token
      if (!result.link.includes(result.token)) {
        throw new Error("Expected link to contain token");
      }
    });

    it("should generate unique tokens for same group", async () => {
      const result1 = await groupGateway.generateInvitation(groupId);
      const result2 = await groupGateway.generateInvitation(groupId);

      if (result1.token === result2.token) {
        throw new Error("Expected different tokens for each invitation");
      }
    });

    it("should generate valid token format", async () => {
      const result = await groupGateway.generateInvitation(groupId);

      // Token should start with the prefix
      if (!result.token.startsWith("invite-")) {
        throw new Error("Expected token to start with 'invite-' prefix");
      }

      // Token should have sufficient length
      if (result.token.length < 20) {
        throw new Error("Expected token to have minimum length");
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject invalid group ID", async () => {
      try {
        await groupGateway.generateInvitation("non-existent-group");
        throw new Error("Expected error for non-existent group");
      } catch (error) {
        const message = (error as Error).message;
        if (!message.includes("non trouvé") && !message.includes("not found")) {
          throw error;
        }
      }
    });

    it("should reject empty group ID", async () => {
      try {
        await groupGateway.generateInvitation("");
        throw new Error("Expected error for empty group ID");
      } catch (error) {
        // Expected error
      }
    });
  });
});

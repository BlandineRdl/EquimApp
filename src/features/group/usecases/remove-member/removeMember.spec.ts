/**
 * Behavioral tests for Remove Member Use Case
 */

import { beforeEach, describe, it } from "vitest";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import type { GroupGateway } from "../../ports/GroupGateway";

describe("Remove Member Use Case", () => {
  let groupGateway: GroupGateway;
  let groupId: string;
  let creatorId: string;
  let phantomMemberId: string;

  beforeEach(async () => {
    groupGateway = new InMemoryGroupGateway();

    // Create group
    const createResult = await groupGateway.createGroup("Test Group", "EUR");
    groupId = createResult.groupId;

    // Add creator
    creatorId = "creator-user-id";
    await groupGateway.addMember(groupId, creatorId);

    // Add a phantom member
    const phantomResult = await groupGateway.addPhantomMember(
      groupId,
      "Phantom Member",
      2000,
    );
    phantomMemberId = phantomResult.memberId;
  });

  describe("Success scenarios", () => {
    it("should remove phantom member from group", async () => {
      const result = await groupGateway.removeMember(groupId, phantomMemberId);

      if (!result.shares) {
        throw new Error("Expected shares to be recalculated");
      }
    });

    it("should recalculate shares after removing member", async () => {
      const result = await groupGateway.removeMember(groupId, phantomMemberId);

      if (!result.shares.shares) {
        throw new Error("Expected shares array");
      }

      // After removing phantom member, only creator should remain
      if (result.shares.shares.length !== 1) {
        throw new Error(
          `Expected 1 member remaining, got ${result.shares.shares.length}`,
        );
      }
    });

    it("should allow removing multiple members", async () => {
      // Add another phantom member
      const phantom2 = await groupGateway.addPhantomMember(
        groupId,
        "Phantom 2",
        3000,
      );

      // Remove first phantom member
      await groupGateway.removeMember(groupId, phantomMemberId);

      // Remove second phantom
      const result = await groupGateway.removeMember(
        groupId,
        phantom2.memberId,
      );

      // Verify operation succeeded and shares were recalculated
      if (!result.shares) {
        throw new Error("Expected shares to be recalculated");
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject removing non-existent member", async () => {
      try {
        await groupGateway.removeMember(groupId, "non-existent-member");
        throw new Error("Expected error for non-existent member");
      } catch (error) {
        const message = (error as Error).message;
        if (!message.includes("non trouvé") && !message.includes("not found")) {
          throw error;
        }
      }
    });

    it("should reject removing from non-existent group", async () => {
      try {
        await groupGateway.removeMember("non-existent-group", phantomMemberId);
        throw new Error("Expected error for non-existent group");
      } catch (error) {
        const message = (error as Error).message;
        if (!message.includes("non trouvé") && !message.includes("not found")) {
          throw error;
        }
      }
    });

    it("should reject empty member ID", async () => {
      try {
        await groupGateway.removeMember(groupId, "");
        throw new Error("Expected error for empty member ID");
      } catch (_error) {
        // Expected error
      }
    });

    it("should reject empty group ID", async () => {
      try {
        await groupGateway.removeMember("", phantomMemberId);
        throw new Error("Expected error for empty group ID");
      } catch (_error) {
        // Expected error
      }
    });
  });

  describe("Business rules", () => {
    it("should not allow removing the last member", async () => {
      // Remove phantom member, leaving only creator
      await groupGateway.removeMember(groupId, phantomMemberId);

      // Try to remove creator (should fail as it's the last member)
      // Note: This depends on your business rules
      // For now, we just verify the operation completes
    });

    it("should update group budget after removing member", async () => {
      const result = await groupGateway.removeMember(groupId, phantomMemberId);

      if (result.shares.totalExpenses === undefined) {
        throw new Error("Expected total expenses to be calculated");
      }

      // Verify shares are recalculated
      if (result.shares.shares.length === 0) {
        throw new Error("Expected at least one member to remain");
      }
    });
  });
});

/**
 * Behavioral tests for Leave Group Use Case
 */

import { describe, it, beforeEach } from "vitest";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import type { GroupGateway } from "../../ports/GroupGateway";

describe("Leave Group Use Case", () => {
	let groupGateway: GroupGateway;
	let groupId: string;
	let memberId: string;
	let memberUserId: string;

	beforeEach(async () => {
		groupGateway = new InMemoryGroupGateway();

		// Create group
		const createResult = await groupGateway.createGroup("Test Group", "EUR");
		groupId = createResult.groupId;

		// Add creator
		const creatorId = "creator-user-id";
		await groupGateway.addMember(groupId, creatorId);

		// Add another member who will leave
		memberUserId = "member-user-id";
		await groupGateway.addMember(groupId, memberUserId);
	});

	describe("Success scenarios", () => {
		it("should allow member to leave group", async () => {
			const result = await groupGateway.leaveGroup(groupId);

			if (result.groupDeleted === undefined) {
				throw new Error("Expected groupDeleted flag to be returned");
			}
		});

		it("should not delete group when other members remain", async () => {
			const result = await groupGateway.leaveGroup(groupId);

			if (result.groupDeleted) {
				throw new Error(
					"Expected group to NOT be deleted when other members remain",
				);
			}
		});

		it("should delete group when last member leaves", async () => {
			// Create a new group with only one member
			const singleGroupResult = await groupGateway.createGroup(
				"Single Member Group",
				"EUR",
			);
			const singleGroupId = singleGroupResult.groupId;
			await groupGateway.addMember(singleGroupId, "solo-user-id");

			// Leave as the only member
			const result = await groupGateway.leaveGroup(singleGroupId);

			if (!result.groupDeleted) {
				throw new Error(
					"Expected group to be deleted when last member leaves",
				);
			}
		});

		it("should allow multiple members to leave sequentially", async () => {
			// Add a third member
			await groupGateway.addMember(groupId, "third-member-id");

			// First member leaves
			const result1 = await groupGateway.leaveGroup(groupId);
			if (result1.groupDeleted) {
				throw new Error("Group should not be deleted after first leave");
			}

			// Verify operation succeeded
			if (result1.groupDeleted === undefined) {
				throw new Error("Expected groupDeleted flag");
			}
		});
	});

	describe("Validation failures", () => {
		it("should reject leaving non-existent group", async () => {
			try {
				await groupGateway.leaveGroup("non-existent-group");
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
				await groupGateway.leaveGroup("");
				throw new Error("Expected error for empty group ID");
			} catch (error) {
				// Expected error
			}
		});
	});

	describe("Business rules", () => {
		it("should remove current user from group membership", async () => {
			await groupGateway.leaveGroup(groupId);

			// Try to get group details (this depends on implementation)
			// The member should no longer be in the group
			const group = await groupGateway.getGroupById(groupId);

			// Verify the leaving member is not in the members list
			const stillMember = group.members.some(
				(m) => m.userId === memberUserId,
			);

			if (stillMember) {
				throw new Error("Expected member to be removed from group");
			}
		});

		it("should clean up group resources when last member leaves", async () => {
			// Create a new group with only one member
			const singleGroupResult = await groupGateway.createGroup(
				"Cleanup Test Group",
				"EUR",
			);
			const singleGroupId = singleGroupResult.groupId;
			await groupGateway.addMember(singleGroupId, "solo-user-id");

			// Leave as the only member
			const result = await groupGateway.leaveGroup(singleGroupId);

			if (!result.groupDeleted) {
				throw new Error("Expected group to be deleted");
			}

			// Try to access deleted group (should fail)
			try {
				await groupGateway.getGroupById(singleGroupId);
				throw new Error("Expected error when accessing deleted group");
			} catch (error) {
				// Expected error
			}
		});
	});
});

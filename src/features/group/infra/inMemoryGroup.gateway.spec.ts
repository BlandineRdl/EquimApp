import type { Group } from "../domain/group.model";
import type { AddMemberData } from "../ports/group.gateway";
import { InMemoryGroupGateway } from "./inMemoryGroup.gateway";

describe("InMemoryGroupGateway", () => {
  let gateway: InMemoryGroupGateway;
  let sampleGroup: Group;

  beforeEach(() => {
    gateway = new InMemoryGroupGateway();

    sampleGroup = {
      id: "group-1",
      name: "Mon Foyer",
      expenses: [],
      totalMonthlyBudget: 2500,
      members: [
        {
          id: "member-alice",
          pseudo: "Alice",
          monthlyIncome: 3000,
        },
      ],
    };

    gateway.seed([sampleGroup]);
  });

  afterEach(() => {
    gateway.reset();
  });

  describe("generateInviteLink", () => {
    it("should generate a link with group ID and timestamp", async () => {
      const link = await gateway.generateInviteLink("group-1");

      expect(link).toMatch(/^invite-group-1-\d+$/);
    });

    it("should generate different links for different groups", async () => {
      const link1 = await gateway.generateInviteLink("group-1");
      const link2 = await gateway.generateInviteLink("group-2");

      expect(link1).not.toBe(link2);
      expect(link1).toContain("group-1");
      expect(link2).toContain("group-2");
    });
  });

  describe("getInvitationDetails", () => {
    it("should extract group details from token", async () => {
      const token = "invite-group-1-1234567890";

      const details = await gateway.getInvitationDetails(token);

      expect(details).toEqual({
        groupId: "group-1",
        groupName: "Mon Foyer",
        createdBy: "Alice",
      });
    });

    it("should handle unknown group", async () => {
      const token = "invite-unknown-group-1234567890";

      const details = await gateway.getInvitationDetails(token);

      expect(details).toEqual({
        groupId: "unknown-group",
        groupName: "Groupe inconnu",
        createdBy: "Utilisateur",
      });
    });

    it("should handle group without members", async () => {
      const emptyGroup: Group = {
        id: "group-empty",
        name: "Groupe Vide",
        expenses: [],
        totalMonthlyBudget: 0,
        members: [],
      };

      gateway.seed([emptyGroup]);

      const token = "invite-group-empty-1234567890";
      const details = await gateway.getInvitationDetails(token);

      expect(details).toEqual({
        groupId: "group-empty",
        groupName: "Groupe Vide",
        createdBy: "Utilisateur",
      });
    });
  });

  describe("acceptInvitation", () => {
    it("should add member to group from invitation token", async () => {
      const token = "invite-group-1-1234567890";
      const memberData: AddMemberData = {
        pseudo: "Bob",
        monthlyIncome: 2500,
      };

      const updatedGroup = await gateway.acceptInvitation(token, memberData);

      expect(updatedGroup.id).toBe("group-1");
      expect(updatedGroup.members).toHaveLength(2);
      expect(updatedGroup.members[1]).toEqual({
        id: "member-Bob",
        pseudo: "Bob",
        monthlyIncome: 2500,
      });
    });

    it("should work with full flow", async () => {
      // Generate invite
      const inviteLink = await gateway.generateInviteLink("group-1");

      // Get details
      const details = await gateway.getInvitationDetails(inviteLink);
      expect(details.groupId).toBe("group-1");

      // Accept invitation
      const memberData: AddMemberData = {
        pseudo: "Charlie",
        monthlyIncome: 2800,
      };

      const updatedGroup = await gateway.acceptInvitation(
        inviteLink,
        memberData,
      );

      expect(updatedGroup.members).toHaveLength(2);
      expect(updatedGroup.members[1].pseudo).toBe("Charlie");
    });
  });

  describe("refuseInvitation", () => {
    it("should return void without error", async () => {
      const token = "invite-group-1-1234567890";

      const result = await gateway.refuseInvitation(token);

      expect(result).toBeUndefined();
    });
  });
});

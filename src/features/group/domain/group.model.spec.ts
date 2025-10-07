import type { Group, GroupMember, InvitationDetails } from "./group.model";

describe("Group Models", () => {
  describe("GroupMember", () => {
    it("should have required properties", () => {
      const member: GroupMember = {
        id: "member-1",
        pseudo: "Alice",
        monthlyIncome: 3000,
      };

      expect(member.id).toBe("member-1");
      expect(member.pseudo).toBe("Alice");
      expect(member.monthlyIncome).toBe(3000);
    });
  });

  describe("Group", () => {
    it("should have required properties", () => {
      const group: Group = {
        id: "group-1",
        name: "Mon Foyer",
        expenses: [],
        totalMonthlyBudget: 2500,
        members: [],
      };

      expect(group.id).toBe("group-1");
      expect(group.name).toBe("Mon Foyer");
      expect(group.expenses).toEqual([]);
      expect(group.totalMonthlyBudget).toBe(2500);
      expect(group.members).toEqual([]);
    });
  });

  describe("InvitationDetails", () => {
    it("should have required properties", () => {
      const invitation: InvitationDetails = {
        groupId: "group-1",
        groupName: "Mon Foyer",
        createdBy: "Alice",
      };

      expect(invitation.groupId).toBe("group-1");
      expect(invitation.groupName).toBe("Mon Foyer");
      expect(invitation.createdBy).toBe("Alice");
    });
  });
});

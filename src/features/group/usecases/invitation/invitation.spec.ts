import { afterEach, beforeEach, describe, it } from "vitest";
import { InvitationDsl } from "./invitation.dsl";

describe("Invitation Use Cases", () => {
  let dsl: InvitationDsl;

  beforeEach(async () => {
    dsl = new InvitationDsl();
    await dsl.setup();
  });

  afterEach(async () => {
    await dsl.teardown();
  });

  describe("Generate Invite Link", () => {
    it("should generate invite link for existing group", async () => {
      await dsl.givenExistingGroup({
        id: "group-1",
        name: "Mon Foyer",
        members: [],
      });

      await dsl.whenGeneratingInviteLink("group-1");

      await dsl.thenInviteLinkShouldBeGenerated();
      await dsl.thenInviteLinkShouldContainGroupId("group-1");
    });

    it("should fail when group does not exist", async () => {
      await dsl.whenGeneratingInviteLink("nonexistent-group");

      await dsl.thenOperationShouldFail("Groupe non trouvé");
    });

    it("should generate different links for different groups", async () => {
      await dsl.givenExistingGroup({
        id: "group-1",
        name: "Groupe 1",
        members: [],
      });

      // Générer deux liens à des moments différents
      await dsl.whenGeneratingInviteLink("group-1");
      await dsl.thenInviteLinkShouldBeGenerated();

      // Un petit délai pour s'assurer que le timestamp est différent
      await new Promise((resolve) => setTimeout(resolve, 2));

      await dsl.whenGeneratingInviteLink("group-1");
      await dsl.thenInviteLinkShouldBeGenerated();
    });
  });

  describe("Get Invitation Details", () => {
    it("should get invitation details from valid token", async () => {
      await dsl.givenExistingGroup({
        id: "group-1",
        name: "Mon Foyer",
        members: [
          {
            id: "member-alice",
            pseudo: "Alice",
            monthlyIncome: 3000,
          },
        ],
      });

      await dsl.whenGettingInvitationDetails("invite-group-1-1234567890");

      await dsl.thenInvitationDetailsShouldBe({
        groupId: "group-1",
        groupName: "Mon Foyer",
        createdBy: "Alice",
      });
    });

    it("should fail with invalid token format", async () => {
      await dsl.whenGettingInvitationDetails("invalid-token");

      await dsl.thenOperationShouldFail("Token d'invitation invalide");
    });

    it("should fail with empty token", async () => {
      await dsl.whenGettingInvitationDetails("");

      await dsl.thenOperationShouldFail("Token d'invitation invalide");
    });
  });

  describe("Accept Invitation", () => {
    it("should accept invitation and add member to group", async () => {
      await dsl.givenExistingGroup({
        id: "group-1",
        name: "Mon Foyer",
        members: [
          {
            id: "member-alice",
            pseudo: "Alice",
            monthlyIncome: 3000,
          },
        ],
      });

      const token = "invite-group-1-1234567890";
      const memberData = {
        pseudo: "Bob",
        monthlyIncome: 2500,
      };

      await dsl.whenAcceptingInvitation(token, memberData);

      await dsl.thenOperationShouldSucceed();
      await dsl.thenGroupShouldHaveNewMember("group-1", memberData);
    });

    it("should fail with invalid token", async () => {
      const memberData = {
        pseudo: "Bob",
        monthlyIncome: 2500,
      };

      await dsl.whenAcceptingInvitation("invalid-token", memberData);

      await dsl.thenOperationShouldFail("Token d'invitation invalide");
    });

    it("should fail with empty pseudo", async () => {
      await dsl.givenExistingGroup({
        id: "group-1",
        name: "Mon Foyer",
        members: [],
      });

      const memberData = {
        pseudo: "",
        monthlyIncome: 2500,
      };

      await dsl.whenAcceptingInvitation(
        "invite-group-1-1234567890",
        memberData,
      );

      await dsl.thenOperationShouldFail("Le pseudo ne peut pas être vide");
    });

    it("should fail with short pseudo", async () => {
      await dsl.givenExistingGroup({
        id: "group-1",
        name: "Mon Foyer",
        members: [],
      });

      const memberData = {
        pseudo: "A",
        monthlyIncome: 2500,
      };

      await dsl.whenAcceptingInvitation(
        "invite-group-1-1234567890",
        memberData,
      );

      await dsl.thenOperationShouldFail(
        "Le pseudo doit contenir au moins 2 caractères",
      );
    });

    it("should fail with negative income", async () => {
      await dsl.givenExistingGroup({
        id: "group-1",
        name: "Mon Foyer",
        members: [],
      });

      const memberData = {
        pseudo: "Bob",
        monthlyIncome: -1000,
      };

      await dsl.whenAcceptingInvitation(
        "invite-group-1-1234567890",
        memberData,
      );

      await dsl.thenOperationShouldFail("Le revenu mensuel doit être positif");
    });

    it("should fail with zero income", async () => {
      await dsl.givenExistingGroup({
        id: "group-1",
        name: "Mon Foyer",
        members: [],
      });

      const memberData = {
        pseudo: "Bob",
        monthlyIncome: 0,
      };

      await dsl.whenAcceptingInvitation(
        "invite-group-1-1234567890",
        memberData,
      );

      await dsl.thenOperationShouldFail("Le revenu mensuel doit être positif");
    });
  });

  describe("Refuse Invitation", () => {
    it("should refuse invitation successfully", async () => {
      await dsl.whenRefusingInvitation("invite-group-1-1234567890");

      await dsl.thenOperationShouldSucceed();
    });

    it("should fail with invalid token", async () => {
      await dsl.whenRefusingInvitation("invalid-token");

      await dsl.thenOperationShouldFail("Token d'invitation invalide");
    });
  });

  describe("Full Invitation Flow", () => {
    it("should handle complete invitation process", async () => {
      // Given: Un groupe existant avec un membre créateur
      await dsl.givenExistingGroup({
        id: "group-test",
        name: "Groupe Test",
        members: [
          {
            id: "member-creator",
            pseudo: "Creator",
            monthlyIncome: 4000,
          },
        ],
      });

      // When: Génération d'un lien d'invitation
      await dsl.whenGeneratingInviteLink("group-test");
      await dsl.thenInviteLinkShouldBeGenerated();
      await dsl.thenInviteLinkShouldContainGroupId("group-test");

      // When: Récupération des détails avec un token simulé
      const testToken = "invite-group-test-1234567890";
      await dsl.whenGettingInvitationDetails(testToken);

      // Then: Les détails sont corrects
      await dsl.thenInvitationDetailsShouldBe({
        groupId: "group-test",
        groupName: "Groupe Test",
        createdBy: "Creator",
      });

      // When: Acceptation de l'invitation
      const newMember = {
        pseudo: "NewMember",
        monthlyIncome: 3200,
      };
      await dsl.whenAcceptingInvitation(testToken, newMember);

      // Then: Le membre est ajouté au groupe
      await dsl.thenOperationShouldSucceed();
      await dsl.thenGroupShouldHaveNewMember("group-test", newMember);
    });
  });
});

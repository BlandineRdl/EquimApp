import { afterEach, beforeEach, describe, it } from "vitest";
import { AddMemberDsl } from "./addMember.dsl";

describe("Feature: Ajouter un membre au groupe", () => {
  let addMemberDsl: AddMemberDsl;

  beforeEach(async () => {
    addMemberDsl = new AddMemberDsl();
    await addMemberDsl.setup();
  });

  afterEach(async () => {
    await addMemberDsl.teardown();
  });

  it("Peut ajouter un nouveau membre au groupe", async () => {
    // Given
    await addMemberDsl.givenExistingGroup({
      id: "group-1",
      name: "Foyer",
      members: [{ id: "member-1", pseudo: "Alice", monthlyIncome: 3000 }],
    });

    // When
    await addMemberDsl.whenAddingMemberToGroup({
      groupId: "group-1",
      pseudo: "Bob",
      monthlyIncome: 2500,
    });

    // Then
    await addMemberDsl.thenGroupShouldHaveMembers([
      { id: "member-1", pseudo: "Alice", monthlyIncome: 3000 },
      { id: "member-Bob", pseudo: "Bob", monthlyIncome: 2500 },
    ]);
  });

  it("Refuse d'ajouter un membre avec un pseudo vide", async () => {
    // Given
    await addMemberDsl.givenExistingGroup({
      id: "group-1",
      name: "Foyer",
      members: [{ id: "member-1", pseudo: "Alice", monthlyIncome: 3000 }],
    });

    // When
    await addMemberDsl.whenAddingMemberToGroup({
      groupId: "group-1",
      pseudo: "",
      monthlyIncome: 2500,
    });

    // Then
    await addMemberDsl.thenOperationShouldFail(
      "Le pseudo ne peut pas être vide",
    );
  });

  it("Refuse d'ajouter un membre avec un revenu négatif", async () => {
    // Given
    await addMemberDsl.givenExistingGroup({
      id: "group-1",
      name: "Foyer",
      members: [{ id: "member-1", pseudo: "Alice", monthlyIncome: 3000 }],
    });

    // When
    await addMemberDsl.whenAddingMemberToGroup({
      groupId: "group-1",
      pseudo: "Charlie",
      monthlyIncome: -100,
    });

    // Then
    await addMemberDsl.thenOperationShouldFail(
      "Le revenu mensuel doit être positif",
    );
  });
});

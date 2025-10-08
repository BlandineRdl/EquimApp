/**
 * DSL for Add Phantom Member Use Case
 * Test Driven Development - Behavior specification
 */

import { BaseDsl } from "../../../../test/dsl";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import type { GroupGateway } from "../../ports/GroupGateway";
import type { AddMemberData } from "./addMember.usecase";

interface AddMemberResult {
  memberId: string;
  shares: {
    shares: Array<{
      pseudo: string;
      sharePercentage: number;
    }>;
    totalExpenses: number;
  };
}

export class AddMemberDSL extends BaseDsl<AddMemberResult> {
  private groupGateway: GroupGateway;
  private groupId: string | null = null;
  private memberData: AddMemberData | null = null;

  constructor() {
    super();
    this.groupGateway = new InMemoryGroupGateway();
  }

  // ============================================================================
  // GIVEN - Setup initial state
  // ============================================================================

  givenAGroupExists(): this {
    this.setupPromise = this._createGroup();
    return this;
  }

  private async _createGroup(): Promise<void> {
    const { groupId } = await this.groupGateway.createGroup(
      "Test Group",
      "EUR",
    );
    this.groupId = groupId;
    await this.groupGateway.addMember(groupId, "current-user");
  }

  givenMemberData(pseudo: string, monthlyIncome: number): this {
    this.memberData = { pseudo, monthlyIncome };
    return this;
  }

  givenInvalidPseudo(pseudo: string): this {
    return this.givenMemberData(pseudo, 2000);
  }

  givenInvalidIncome(income: number): this {
    return this.givenMemberData("Valid Pseudo", income);
  }

  // ============================================================================
  // WHEN - Execute the action
  // ============================================================================

  async whenAddingPhantomMember(): Promise<this> {
    await this.executeAction(async () => {
      if (!this.groupId || !this.memberData) {
        throw new Error("Missing test setup: groupId or memberData");
      }

      return await this.groupGateway.addPhantomMember(
        this.groupId,
        this.memberData.pseudo,
        this.memberData.monthlyIncome,
      );
    });

    return this;
  }

  // ============================================================================
  // THEN - Assertions
  // ============================================================================

  thenPhantomMemberShouldBeAdded(): this {
    if (!this.result) {
      throw new Error("Expected result but got null");
    }

    if (!this.result.memberId) {
      throw new Error("Expected memberId in result");
    }

    if (!this.result.shares) {
      throw new Error("Expected shares in result");
    }

    return this;
  }

  thenSharesShouldBeRecalculated(): this {
    if (!this.result?.shares) {
      throw new Error("Expected shares to be calculated");
    }

    if (!Array.isArray(this.result.shares.shares)) {
      throw new Error("Expected shares.shares to be an array");
    }

    // Should have at least 2 members (current user + phantom)
    if (this.result.shares.shares.length < 2) {
      throw new Error(
        `Expected at least 2 members in shares, got ${this.result.shares.shares.length}`,
      );
    }

    return this;
  }

  thenPhantomMemberShouldHaveCorrectShare(): this {
    if (!this.result?.shares || !this.memberData) {
      throw new Error("Missing result or memberData");
    }

    const phantomMember = this.result.shares.shares.find(
      (s) => s.pseudo === this.memberData?.pseudo,
    );

    if (!phantomMember) {
      throw new Error(
        `Phantom member ${this.memberData.pseudo} not found in shares`,
      );
    }

    if (phantomMember.sharePercentage <= 0) {
      throw new Error(
        "Expected phantom member to have a positive share percentage",
      );
    }

    return this;
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  override reset(): this {
    super.reset();
    this.groupId = null;
    this.memberData = null;
    this.groupGateway = new InMemoryGroupGateway();
    return this;
  }
}

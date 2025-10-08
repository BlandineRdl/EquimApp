/**
 * DSL for Add Phantom Member Use Case
 * Test Driven Development - Behavior specification
 * 
 * Simplified API: Only WHEN methods are async, GIVEN/THEN are sync
 */

import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import type { GroupGateway } from "../../ports/GroupGateway";
import type { AddMemberData } from "./addMember.usecase";

export class AddMemberDSL {
  private groupGateway: GroupGateway;
  private groupId: string | null = null;
  private memberData: AddMemberData | null = null;
  private result: any = null;
  private error: Error | null = null;
  private _setupPromise: Promise<void> | null = null;

  constructor() {
    this.groupGateway = new InMemoryGroupGateway();
  }

  // ============================================================================
  // GIVEN - Setup initial state (synchronous chaining)
  // ============================================================================

  givenAGroupExists(): this {
    this._setupPromise = this._createGroup();
    return this;
  }

  private async _createGroup(): Promise<void> {
    const { groupId } = await this.groupGateway.createGroup("Test Group", "EUR");
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
  // WHEN - Execute the action (async)
  // ============================================================================

  async whenAddingPhantomMember(): Promise<this> {
    // Wait for setup to complete
    if (this._setupPromise) {
      await this._setupPromise;
    }

    try {
      if (!this.groupId || !this.memberData) {
        throw new Error("Missing test setup: groupId or memberData");
      }

      this.result = await this.groupGateway.addPhantomMember(
        this.groupId,
        this.memberData.pseudo,
        this.memberData.monthlyIncome,
      );
      this.error = null;
    } catch (error) {
      this.error = error as Error;
      this.result = null;
    }

    return this;
  }

  // ============================================================================
  // THEN - Assertions (synchronous chaining)
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
      (s: any) => s.pseudo === this.memberData!.pseudo,
    );

    if (!phantomMember) {
      throw new Error(
        `Phantom member ${this.memberData.pseudo} not found in shares`,
      );
    }

    if (phantomMember.sharePercentage <= 0) {
      throw new Error("Expected phantom member to have a positive share percentage");
    }

    return this;
  }

  thenShouldFailWithError(expectedMessage: string): this {
    if (!this.error) {
      throw new Error("Expected an error but operation succeeded");
    }

    if (!this.error.message.includes(expectedMessage)) {
      throw new Error(
        `Expected error message to contain "${expectedMessage}", but got "${this.error.message}"`,
      );
    }

    return this;
  }

  thenShouldSucceed(): this {
    if (this.error) {
      throw new Error(`Expected success but got error: ${this.error.message}`);
    }

    if (!this.result) {
      throw new Error("Expected a result but got null");
    }

    return this;
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  getResult() {
    return this.result;
  }

  getError() {
    return this.error;
  }

  reset(): this {
    this.groupId = null;
    this.memberData = null;
    this.result = null;
    this.error = null;
    this._setupPromise = null;
    this.groupGateway = new InMemoryGroupGateway();
    return this;
  }
}

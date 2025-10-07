import type { Action, ThunkDispatch } from "@reduxjs/toolkit";
import { expect } from "vitest";
import type { AppState } from "../../../../store/appState";
import {
  type Dependencies,
  initReduxStore,
} from "../../../../store/buildReduxStore";
import type { Group, InvitationDetails } from "../../domain/group.model";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import { loadUserGroups } from "../load-groups/loadGroups.usecase";
import { acceptInvitation } from "./acceptInvitation.usecase";
import { generateInviteLink } from "./generateInviteLink.usecase";
import { getInvitationDetails } from "./getInvitationDetails.usecase";
import { refuseInvitation } from "./refuseInvitation.usecase";

export class InvitationDsl {
  private groupGateway = new InMemoryGroupGateway();
  private store = initReduxStore({ groupGateway: this.groupGateway });
  private lastError: string | null = null;
  private lastInviteLink: string | null = null;
  private lastInvitationDetails: InvitationDetails | null = null;

  private get dispatch(): ThunkDispatch<AppState, Dependencies, Action> {
    return this.store.dispatch;
  }

  async setup(): Promise<void> {}

  async teardown(): Promise<void> {
    this.groupGateway.reset();
    this.lastError = null;
    this.lastInviteLink = null;
    this.lastInvitationDetails = null;
  }

  async givenExistingGroup(
    group: Partial<Group> & { id: string },
  ): Promise<void> {
    const defaultGroup: Group = {
      id: group.id,
      name: group.name ?? "",
      expenses: group.expenses || [],
      totalMonthlyBudget: group.totalMonthlyBudget || 0,
      members: group.members || [],
    };

    this.groupGateway.seed([defaultGroup]);
    await this.dispatch(loadUserGroups()).unwrap();
  }

  async whenGeneratingInviteLink(groupId: string): Promise<void> {
    try {
      this.lastInviteLink = await this.dispatch(
        generateInviteLink({ groupId }),
      ).unwrap();
      this.lastError = null;
    } catch (error) {
      this.lastError = this.extractErrorMessage(error);
      this.lastInviteLink = null;
    }
  }

  async whenGettingInvitationDetails(token: string): Promise<void> {
    try {
      this.lastInvitationDetails = await this.dispatch(
        getInvitationDetails({ token }),
      ).unwrap();
      this.lastError = null;
    } catch (error) {
      this.lastError = this.extractErrorMessage(error);
      this.lastInvitationDetails = null;
    }
  }

  async whenAcceptingInvitation(
    token: string,
    memberData: { pseudo: string; monthlyIncome: number },
  ): Promise<void> {
    try {
      await this.dispatch(acceptInvitation({ token, memberData })).unwrap();
      this.lastError = null;
    } catch (error) {
      this.lastError = this.extractErrorMessage(error);
    }
  }

  async whenRefusingInvitation(token: string): Promise<void> {
    try {
      await this.dispatch(refuseInvitation({ token })).unwrap();
      this.lastError = null;
    } catch (error) {
      this.lastError = this.extractErrorMessage(error);
    }
  }

  async thenInviteLinkShouldBeGenerated(): Promise<void> {
    expect(this.lastInviteLink).toBeTruthy();
    expect(this.lastInviteLink).toMatch(/^invite-.+-\d+$/);
  }

  async thenInviteLinkShouldContainGroupId(groupId: string): Promise<void> {
    expect(this.lastInviteLink).toBeTruthy();
    expect(this.lastInviteLink).toContain(groupId);
  }

  async thenInvitationDetailsShouldBe(
    expected: InvitationDetails,
  ): Promise<void> {
    expect(this.lastInvitationDetails).not.toBeNull();
    expect(this.lastInvitationDetails).toEqual(expected);
  }

  async thenGroupShouldHaveNewMember(
    groupId: string,
    expectedMember: { pseudo: string; monthlyIncome: number },
  ): Promise<void> {
    const groups = this.groupGateway.getAllGroups();
    const group = groups.find((g) => g.id === groupId);

    expect(group).toBeDefined();

    const newMember = group?.members.find(
      (m) => m.pseudo === expectedMember.pseudo,
    );
    expect(newMember).toBeDefined();
    expect(newMember?.monthlyIncome).toBe(expectedMember.monthlyIncome);

    // Vérifier que le store Redux est aussi mis à jour
    const state = this.store.getState();
    const storeGroup = state.groups.entities[groupId];
    expect(storeGroup).toBeDefined();

    const storeMember = storeGroup.members.find(
      (m) => m.pseudo === expectedMember.pseudo,
    );
    expect(storeMember).toBeDefined();
  }

  async thenOperationShouldSucceed(): Promise<void> {
    expect(this.lastError).toBeNull();
  }

  async thenOperationShouldFail(expectedError: string): Promise<void> {
    expect(this.lastError).toBeTruthy();
    expect(this.lastError).toContain(expectedError);
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    } else if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message: unknown }).message === "string"
    ) {
      return (error as { message: string }).message;
    } else {
      return String(error);
    }
  }
}

// src/features/group/usecases/add-member/addMember.dsl.ts
import type { Action, ThunkDispatch } from "@reduxjs/toolkit";
import { expect } from "vitest";
import type { AppState } from "../../../../store/appState";
import {
  type Dependencies,
  initReduxStore,
} from "../../../../store/buildReduxStore";
import type { Group, GroupMember } from "../../domain/group.model";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import { loadUserGroups } from "../load-groups/loadGroups.usecase";
import { addMemberToGroup } from "./addMember.usecase";

export class AddMemberDsl {
  private groupGateway = new InMemoryGroupGateway();
  private store = initReduxStore({ groupGateway: this.groupGateway });
  private lastError: string | null = null;

  private get dispatch(): ThunkDispatch<AppState, Dependencies, Action> {
    return this.store.dispatch;
  }

  async setup(): Promise<void> {}

  async teardown(): Promise<void> {
    this.groupGateway.reset();
    this.lastError = null;
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

    // Seed le gateway avec le groupe existant
    this.groupGateway.seed([defaultGroup]);

    // Simuler le flow réel : charger les groupes depuis l'API
    await this.dispatch(loadUserGroups()).unwrap();
  }

  async whenAddingMemberToGroup(data: {
    groupId: string;
    pseudo: string;
    monthlyIncome: number;
  }): Promise<void> {
    try {
      await this.dispatch(
        addMemberToGroup({
          groupId: data.groupId,
          memberData: {
            pseudo: data.pseudo,
            monthlyIncome: data.monthlyIncome,
          },
        }),
      ).unwrap();

      this.lastError = null;
    } catch (error) {
      // Redux Toolkit peut encapsuler l'erreur dans un objet
      if (error instanceof Error) {
        this.lastError = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        this.lastError = (error as { message: string }).message;
      } else {
        this.lastError = String(error);
      }
    }
  }

  async thenGroupShouldHaveMembers(
    expectedMembers: Array<Partial<GroupMember>>,
  ): Promise<void> {
    const groups = this.groupGateway.getAllGroups();
    const group = groups[0];

    expect(group).toBeDefined();
    expect(group.members).toHaveLength(expectedMembers.length);

    expectedMembers.forEach((expectedMember, index) => {
      const actualMember = group.members[index];

      if (expectedMember.id) {
        expect(actualMember.id).toBe(expectedMember.id);
      }
      if (expectedMember.pseudo) {
        expect(actualMember.pseudo).toBe(expectedMember.pseudo);
      }
      if (expectedMember.monthlyIncome) {
        expect(actualMember.monthlyIncome).toBe(expectedMember.monthlyIncome);
      }
    });

    // Vérifier que le store Redux est synchronisé
    const state = this.store.getState();
    const storeGroup = state.groups.entities[group.id];
    expect(storeGroup).toBeDefined();
    expect(storeGroup.members).toHaveLength(expectedMembers.length);
  }

  async thenOperationShouldFail(expectedError: string): Promise<void> {
    expect(this.lastError).toBeTruthy();
    expect(this.lastError).toContain(expectedError);
  }
}

import type {
  Group,
  GroupMember,
  InvitationDetails,
} from "../domain/group.model";
import { INVITATION_TOKEN_PREFIX } from "../domain/group.constants";
import type { AddMemberData, GroupGateway } from "../ports/group.gateway";

export class InMemoryGroupGateway implements GroupGateway {
  private storedGroups: Group[] = [];

  async getUserGroups(): Promise<Group[]> {
    return [...this.storedGroups];
  }

  async addMemberToGroup(
    groupId: string,
    memberData: AddMemberData,
  ): Promise<Group> {
    // Le gateway est "bête" - il trouve le groupe et fait l'opération
    const group = this.storedGroups.find((g) => g.id === groupId);

    // Créer le nouveau membre
    const newMember: GroupMember = {
      id: `member-${memberData.pseudo}`,
      pseudo: memberData.pseudo,
      monthlyIncome: memberData.monthlyIncome,
    };

    // Mettre à jour le groupe avec le nouveau membre (on assume que group existe)
    if (!group) {
      throw new Error(`Group with id ${groupId} not found`);
    }

    const updatedGroup: Group = {
      ...group,
      members: [...group.members, newMember],
    };

    // Remplacer le groupe dans le tableau
    const groupIndex = this.storedGroups.findIndex((g) => g.id === groupId);
    this.storedGroups[groupIndex] = updatedGroup;

    return { ...updatedGroup };
  }

  async generateInviteLink(groupId: string): Promise<string> {
    return `${INVITATION_TOKEN_PREFIX}${groupId}-${Date.now()}`;
  }

  async getInvitationDetails(token: string): Promise<InvitationDetails> {
    const parts = token.split("-");
    const groupId = parts.slice(1, -1).join("-"); // Récupère toute la partie entre "invite" et le timestamp
    const group = this.storedGroups.find((g) => g.id === groupId);

    return {
      groupId,
      groupName: group?.name || "Groupe inconnu",
      createdBy: group?.members[0]?.pseudo || "Utilisateur",
    };
  }

  async acceptInvitation(
    token: string,
    memberData: AddMemberData,
  ): Promise<Group> {
    const details = await this.getInvitationDetails(token);
    return this.addMemberToGroup(details.groupId, memberData);
  }

  async refuseInvitation(_token: string): Promise<void> {
    return;
  }

  // Méthodes pour les tests
  seed(groups: Group[]): void {
    this.storedGroups = [...groups];
  }

  getAllGroups(): Group[] {
    return [...this.storedGroups];
  }

  reset(): void {
    this.storedGroups = [];
  }
}

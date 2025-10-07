import type { Group, InvitationDetails } from "../domain/group.model";

export interface AddMemberData {
  pseudo: string;
  monthlyIncome: number;
}

export interface GroupGateway {
  getUserGroups(): Promise<Group[]>;
  addMemberToGroup(groupId: string, memberData: AddMemberData): Promise<Group>;
  generateInviteLink(groupId: string): Promise<string>;
  getInvitationDetails(token: string): Promise<InvitationDetails>;
  acceptInvitation(token: string, memberData: AddMemberData): Promise<Group>;
  refuseInvitation(token: string): Promise<void>;
}

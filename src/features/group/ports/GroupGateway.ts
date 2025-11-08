export interface MemberShare {
  memberId: string;
  userId: string | null;
  pseudo: string;
  sharePercentage: number;
  shareAmount: number;
}

export interface Shares {
  totalExpenses: number;
  shares: MemberShare[];
}

export interface GroupSummary {
  id: string;
  name: string;
  currency: string;
  memberCount: number;
  totalExpenses: number;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  userId: string | null;
  pseudo: string;
  shareRevenue: boolean;
  incomeOrWeight: number | null;
  monthlyCapacity: number | null;
  joinedAt: string;
  isPhantom?: boolean;
}

export interface Expense {
  id: string;
  groupId: string;
  name: string;
  amount: number;
  currency: string;
  isPredefined: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupFull {
  id: string;
  name: string;
  currency: string;
  creatorId: string;
  members: GroupMember[];
  expenses: Expense[];
  shares: Shares;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationPreview {
  groupName: string;
  creatorPseudo: string;
  expiresAt: string | null;
  isConsumed: boolean;
}

export interface RealtimeCallbacks {
  onExpenseAdded?: (expense: Expense) => void;
  onExpenseUpdated?: (expense: Expense) => void;
  onExpenseDeleted?: (expenseId: string) => void;
  onMemberAdded?: (member: GroupMember) => void;
  onMemberRemoved?: (memberId: string) => void;
}

export type Unsubscribe = () => void;

export interface GroupGateway {
  createGroup(name: string, currency?: string): Promise<{ groupId: string }>;

  getGroupsByUserId(userId: string): Promise<GroupSummary[]>;

  getGroupById(id: string): Promise<GroupFull>;

  createExpense(input: {
    groupId: string;
    name: string;
    amount: number;
    currency: string;
    isPredefined: boolean;
  }): Promise<{ expenseId: string; shares: Shares }>;

  updateExpense(input: {
    expenseId: string;
    groupId: string;
    name?: string;
    amount?: number;
  }): Promise<{ shares: Shares }>;

  deleteExpense(input: {
    expenseId: string;
    groupId: string;
  }): Promise<{ shares: Shares }>;

  generateInvitation(groupId: string): Promise<{ token: string; link: string }>;

  getInvitationDetails(token: string): Promise<InvitationPreview | null>;

  acceptInvitation(token: string): Promise<{ groupId: string; shares: Shares }>;

  addMember(groupId: string, userId: string): Promise<{ shares: Shares }>;

  addPhantomMember(
    groupId: string,
    pseudo: string,
    income?: number,
  ): Promise<{ memberId: string; pseudo: string; shares: Shares }>;

  updatePhantomMember(
    memberId: string,
    newPseudo: string,
    newIncome?: number,
  ): Promise<{ memberId: string; pseudo: string; shares: Shares }>;

  removeMember(groupId: string, memberId: string): Promise<{ shares: Shares }>;

  leaveGroup(groupId: string): Promise<{ groupDeleted: boolean }>;

  deleteGroup(groupId: string): Promise<{ success: boolean }>;

  refreshGroupShares(groupId: string): Promise<{ shares: Shares }>;

  subscribe(groupId: string, callbacks: RealtimeCallbacks): Unsubscribe;
}

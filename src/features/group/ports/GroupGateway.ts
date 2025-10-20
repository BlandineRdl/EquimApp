/**
 * Group Gateway Interface (Phase 5 spec)
 * Comprehensive interface for all group operations
 */

// Types
export interface MemberShare {
  memberId: string; // Unique member ID from group_members table
  userId: string | null; // Null for phantom members
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
  id: string; // Unique member ID from group_members table
  userId: string | null; // Null for phantom members
  pseudo: string;
  shareRevenue: boolean;
  incomeOrWeight: number | null;
  monthlyCapacity: number | null; // Calculated capacity (income - personal expenses)
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

/**
 * Group Gateway Interface
 */
export interface GroupGateway {
  /**
   * Create a new group
   */
  createGroup(name: string, currency?: string): Promise<{ groupId: string }>;

  /**
   * Get all groups for a user
   */
  getGroupsByUserId(userId: string): Promise<GroupSummary[]>;

  /**
   * Get full group details (members, expenses, shares)
   */
  getGroupById(id: string): Promise<GroupFull>;

  /**
   * Create a new expense in a group
   * Returns updated shares
   */
  createExpense(input: {
    groupId: string;
    name: string;
    amount: number;
    currency: string;
    isPredefined: boolean;
  }): Promise<{ expenseId: string; shares: Shares }>;

  /**
   * Update an existing expense
   * Returns updated shares
   */
  updateExpense(input: {
    expenseId: string;
    groupId: string;
    name?: string;
    amount?: number;
  }): Promise<{ shares: Shares }>;

  /**
   * Delete an expense
   * Returns updated shares
   */
  deleteExpense(input: {
    expenseId: string;
    groupId: string;
  }): Promise<{ shares: Shares }>;

  /**
   * Generate invitation link for a group
   */
  generateInvitation(groupId: string): Promise<{ token: string; link: string }>;

  /**
   * Get invitation preview (accessible to anon users)
   */
  getInvitationDetails(token: string): Promise<InvitationPreview | null>;

  /**
   * Accept invitation and join group
   */
  acceptInvitation(token: string): Promise<{ groupId: string; shares: Shares }>;

  /**
   * Add a member to a group (internal, used by onboarding)
   */
  addMember(groupId: string, userId: string): Promise<{ shares: Shares }>;

  /**
   * Add a phantom member (without account)
   * Can be claimed later by a real user
   */
  addPhantomMember(
    groupId: string,
    pseudo: string,
    income: number,
  ): Promise<{ memberId: string; shares: Shares }>;

  /**
   * Remove a member from a group
   * Works with both real and phantom members
   * Cannot remove the group creator
   */
  removeMember(groupId: string, memberId: string): Promise<{ shares: Shares }>;

  /**
   * Leave a group (self)
   * Auto-deletes group if last member
   */
  leaveGroup(groupId: string): Promise<{ groupDeleted: boolean }>;

  /**
   * Delete a group (creator only)
   * Removes all members and deletes the group
   */
  deleteGroup(groupId: string): Promise<{ success: boolean }>;

  /**
   * Refresh group shares (after profile changes, etc.)
   */
  refreshGroupShares(groupId: string): Promise<{ shares: Shares }>;

  /**
   * Subscribe to real-time updates for a group
   */
  subscribe(groupId: string, callbacks: RealtimeCallbacks): Unsubscribe;
}

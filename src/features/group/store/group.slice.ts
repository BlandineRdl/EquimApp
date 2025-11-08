import type { EntityState } from "@reduxjs/toolkit";
import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import type { AppError } from "../../../types/thunk.types";
import { signOut } from "../../auth/usecases/manage-session/signOut.usecase";
import type { Group } from "../domain/manage-group/group.model";
import type { InvitationPreview } from "../ports/GroupGateway";
import { addMemberToGroup } from "../usecases/add-member/addMember.usecase";
import { createGroup } from "../usecases/create-group/createGroup.usecase";
import { deleteGroup } from "../usecases/delete-group/deleteGroup.usecase";
import { addExpenseToGroup } from "../usecases/expense/addExpense.usecase";
import { deleteExpense } from "../usecases/expense/deleteExpense.usecase";
import { updateExpense } from "../usecases/expense/updateExpense.usecase";
import { acceptInvitation } from "../usecases/invitation/acceptInvitation.usecase";
import { generateInviteLink } from "../usecases/invitation/generateInviteLink.usecase";
import { getInvitationDetails } from "../usecases/invitation/getInvitationDetails.usecase";
import { leaveGroup } from "../usecases/leave-group/leaveGroup.usecase";
import { loadGroupById } from "../usecases/load-group/loadGroup.usecase";
import { loadUserGroups } from "../usecases/load-groups/loadGroups.usecase";
import { removeMemberFromGroup } from "../usecases/remove-member/removeMember.usecase";
import { updatePhantomMember } from "../usecases/update-phantom-member/updatePhantomMember.usecase";

interface AddMemberForm {
  groupId: string;
  pseudo: string;
  monthlyIncome: string;
}

export const groupsAdapter = createEntityAdapter<Group>();

interface AddExpenseForm {
  groupId: string;
  name: string;
  amount: string;
}

interface GroupState extends EntityState<Group, string> {
  loading: boolean;
  error: AppError | null;
  addMemberForm: AddMemberForm | null;
  addExpenseForm: AddExpenseForm | null;
  invitation: {
    generateLink: {
      loading: boolean;
      link: string | null;
      error: AppError | null;
    };
    details: {
      loading: boolean;
      data: InvitationPreview | null;
      error: AppError | null;
    };
  };
}

const initialState: GroupState = groupsAdapter.getInitialState({
  loading: false,
  error: null,
  addMemberForm: null,
  addExpenseForm: null,
  invitation: {
    generateLink: {
      loading: false,
      link: null,
      error: null,
    },
    details: {
      loading: false,
      data: null,
      error: null,
    },
  },
});

export const groupSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {
    openAddMemberForm: (state, action) => {
      state.addMemberForm = {
        groupId: action.payload,
        pseudo: "",
        monthlyIncome: "",
      };
    },

    updateAddMemberForm: (state, action) => {
      if (state.addMemberForm) {
        state.addMemberForm = { ...state.addMemberForm, ...action.payload };
      }
    },

    closeAddMemberForm: (state) => {
      state.addMemberForm = null;
    },

    openAddExpenseForm: (state, action) => {
      state.addExpenseForm = {
        groupId: action.payload,
        name: "",
        amount: "",
      };
    },

    updateAddExpenseForm: (state, action) => {
      if (state.addExpenseForm) {
        state.addExpenseForm = { ...state.addExpenseForm, ...action.payload };
      }
    },

    closeAddExpenseForm: (state) => {
      state.addExpenseForm = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserGroups.fulfilled, (state, action) => {
        state.loading = false;
        groupsAdapter.setAll(state, action.payload);
      })
      .addCase(loadUserGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as AppError | undefined) ?? {
          code: "LOAD_GROUPS_FAILED",
          message:
            action.error?.message ?? "Erreur lors du chargement des groupes",
        };
      })
      .addCase(addMemberToGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMemberToGroup.fulfilled, (state, action) => {
        state.loading = false;
        const { groupId, newMember, shares } = action.payload;

        const group = state.entities[groupId];
        if (group) {
          group.members.push(newMember);
          group.shares = shares;
          group.totalMonthlyBudget = shares.totalExpenses;
        }

        state.addMemberForm = null;
      })
      .addCase(addMemberToGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? {
          code: "ADD_MEMBER_FAILED",
          message: action.error?.message ?? "Erreur lors de l'ajout du membre",
        };
      })
      .addCase(generateInviteLink.pending, (state) => {
        state.invitation.generateLink.loading = true;
        state.invitation.generateLink.error = null;
      })
      .addCase(generateInviteLink.fulfilled, (state, action) => {
        state.invitation.generateLink.loading = false;
        state.invitation.generateLink.link = action.payload;
      })
      .addCase(generateInviteLink.rejected, (state, action) => {
        state.invitation.generateLink.loading = false;
        state.invitation.generateLink.error = action.payload ?? {
          code: "GENERATE_INVITE_LINK_FAILED",
          message:
            action.error?.message ?? "Erreur lors de la génération du lien",
        };
      })
      .addCase(getInvitationDetails.pending, (state) => {
        state.invitation.details.loading = true;
        state.invitation.details.error = null;
      })
      .addCase(getInvitationDetails.fulfilled, (state, action) => {
        state.invitation.details.loading = false;
        state.invitation.details.data = action.payload;
      })
      .addCase(getInvitationDetails.rejected, (state, action) => {
        state.invitation.details.loading = false;
        state.invitation.details.error = action.payload ?? {
          code: "GET_INVITATION_DETAILS_FAILED",
          message:
            action.error?.message ??
            "Erreur lors de la récupération des détails",
        };
      })
      .addCase(acceptInvitation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(acceptInvitation.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(acceptInvitation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? {
          code: "ACCEPT_INVITATION_FAILED",
          message:
            action.error?.message ??
            "Erreur lors de l'acceptation de l'invitation",
        };
      })
      .addCase(removeMemberFromGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeMemberFromGroup.fulfilled, (state, action) => {
        state.loading = false;
        const { groupId, memberId, shares } = action.payload;

        const group = state.entities[groupId];
        if (group) {
          group.members = group.members.filter((m) => m.id !== memberId);
          group.shares = shares;
          group.totalMonthlyBudget = shares.totalExpenses;
        }
      })
      .addCase(removeMemberFromGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? {
          code: "REMOVE_MEMBER_FAILED",
          message:
            action.error?.message ?? "Erreur lors de la suppression du membre",
        };
      })
      .addCase(updatePhantomMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePhantomMember.fulfilled, (state, action) => {
        state.loading = false;
        const { groupId, memberId, pseudo, income, shares } = action.payload;

        const group = state.entities[groupId];
        if (group) {
          const member = group.members.find((m) => m.id === memberId);
          if (member?.isPhantom) {
            member.pseudo = pseudo;
            member.incomeOrWeight = income;
            member.monthlyCapacity = income;
          }
          group.shares = shares;
          group.totalMonthlyBudget = shares.totalExpenses;
        }
      })
      .addCase(updatePhantomMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? {
          code: "UPDATE_MEMBER_FAILED",
          message:
            action.error?.message ?? "Erreur lors de la modification du membre",
        };
      })
      .addCase(addExpenseToGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addExpenseToGroup.fulfilled, (state, action) => {
        state.loading = false;
        const { groupId, expense, shares } = action.payload;

        const group = state.entities[groupId];
        if (group) {
          group.expenses.push(expense);
          group.shares = shares;
          group.totalMonthlyBudget = shares.totalExpenses;
        }
      })
      .addCase(addExpenseToGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? {
          code: "ADD_EXPENSE_FAILED",
          message:
            action.error?.message ?? "Erreur lors de l'ajout de la dépense",
        };
      })
      .addCase(deleteExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.loading = false;
        const { groupId, expenseId, shares } = action.payload;

        const group = state.entities[groupId];
        if (group) {
          group.expenses = group.expenses.filter((e) => e.id !== expenseId);
          group.shares = shares;
          group.totalMonthlyBudget = shares.totalExpenses;
        }
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? {
          code: "DELETE_EXPENSE_FAILED",
          message:
            action.error?.message ??
            "Erreur lors de la suppression de la dépense",
        };
      })
      .addCase(updateExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        state.loading = false;
        const { groupId, expenseId, name, amount, shares } = action.payload;

        const group = state.entities[groupId];
        if (group) {
          const expense = group.expenses.find((e) => e.id === expenseId);
          if (expense) {
            expense.name = name;
            expense.amount = amount;
          }
          group.shares = shares;
          group.totalMonthlyBudget = shares.totalExpenses;
        }
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? {
          code: "UPDATE_EXPENSE_FAILED",
          message:
            action.error?.message ??
            "Erreur lors de la modification de la dépense",
        };
      })
      .addCase(loadGroupById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadGroupById.fulfilled, (state, action) => {
        state.loading = false;
        groupsAdapter.upsertOne(state, action.payload);
      })
      .addCase(loadGroupById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as AppError | undefined) ?? {
          code: "LOAD_GROUP_FAILED",
          message:
            action.error?.message ?? "Erreur lors du rechargement du groupe",
        };
      })
      .addCase(leaveGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.loading = false;
        const { groupId } = action.payload;

        groupsAdapter.removeOne(state, groupId);
      })
      .addCase(leaveGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? {
          code: "LEAVE_GROUP_FAILED",
          message:
            action.error?.message ?? "Erreur lors de la sortie du groupe",
        };
      })
      .addCase(deleteGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.loading = false;
        const { groupId } = action.payload;

        groupsAdapter.removeOne(state, groupId);
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? {
          code: "DELETE_GROUP_FAILED",
          message:
            action.error?.message ?? "Erreur lors de la suppression du groupe",
        };
      })
      .addCase(createGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, _action) => {
        state.loading = false;
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? {
          code: "CREATE_GROUP_FAILED",
          message:
            action.error?.message ?? "Erreur lors de la création du groupe",
        };
      })
      .addCase(signOut.fulfilled, (state) => {
        groupsAdapter.removeAll(state);
        state.loading = false;
        state.error = null;
        state.invitation.details.data = null;
        state.invitation.generateLink.link = null;
        state.addMemberForm = null;
        state.addExpenseForm = null;
      });
  },
});

export const {
  openAddMemberForm,
  updateAddMemberForm,
  closeAddMemberForm,
  openAddExpenseForm,
  updateAddExpenseForm,
  closeAddExpenseForm,
} = groupSlice.actions;

export const groupReducer = groupSlice.reducer;

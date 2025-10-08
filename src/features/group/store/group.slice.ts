import type { EntityState } from "@reduxjs/toolkit";
import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import type { Group, InvitationDetails } from "../domain/group.model";
import { addMemberToGroup } from "../usecases/add-member/addMember.usecase";
import { createGroup } from "../usecases/create-group/createGroup.usecase";
import { deleteGroup } from "../usecases/delete-group/deleteGroup.usecase";
import { addExpenseToGroup } from "../usecases/expense/addExpense.usecase";
import { deleteExpense } from "../usecases/expense/deleteExpense.usecase";
import { acceptInvitation } from "../usecases/invitation/acceptInvitation.usecase";
import { generateInviteLink } from "../usecases/invitation/generateInviteLink.usecase";
import { getInvitationDetails } from "../usecases/invitation/getInvitationDetails.usecase";
import { leaveGroup } from "../usecases/leave-group/leaveGroup.usecase";
import { loadGroupById } from "../usecases/load-group/loadGroup.usecase";
import { loadUserGroups } from "../usecases/load-groups/loadGroups.usecase";
import { removeMemberFromGroup } from "../usecases/remove-member/removeMember.usecase";

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
  error: string | null;
  addMemberForm: AddMemberForm | null;
  addExpenseForm: AddExpenseForm | null;
  invitation: {
    generateLink: {
      loading: boolean;
      link: string | null;
      error: string | null;
    };
    details: {
      loading: boolean;
      data: InvitationDetails | null;
      error: string | null;
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
    // Actions pour gérer le formulaire d'ajout de membre
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

    // Actions pour gérer le formulaire d'ajout de dépense
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
      // completeOnboarding returns groupId only, not the full group object
      // Groups will be loaded separately via loadUserGroups
      // Charger les groupes utilisateur
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
        state.error =
          action.error.message || "Erreur lors du chargement des groupes";
      })
      // Ajouter un membre au groupe
      .addCase(addMemberToGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMemberToGroup.fulfilled, (state, action) => {
        state.loading = false;
        const { groupId, newMember, shares } = action.payload;

        // Mettre à jour le groupe existant
        const group = state.entities[groupId];
        if (group) {
          // Ajouter le nouveau membre
          group.members.push(newMember);
          // Mettre à jour les shares
          group.shares = shares;
          // Mettre à jour le budget total
          group.totalMonthlyBudget = shares.totalExpenses;
        }

        // Fermer le formulaire
        state.addMemberForm = null;
      })
      .addCase(addMemberToGroup.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Erreur lors de l'ajout du membre";
      })
      // Generate invite link
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
        state.invitation.generateLink.error =
          action.error.message || "Erreur lors de la génération du lien";
      })
      // Get invitation details
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
        state.invitation.details.error =
          action.error.message || "Erreur lors de la récupération des détails";
      })
      // Accept invitation
      .addCase(acceptInvitation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(acceptInvitation.fulfilled, (state) => {
        state.loading = false;
        // Group will be loaded separately via loadUserGroups
      })
      .addCase(acceptInvitation.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message ||
          "Erreur lors de l'acceptation de l'invitation";
      })
      // Remove member from group
      .addCase(removeMemberFromGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeMemberFromGroup.fulfilled, (state, action) => {
        state.loading = false;
        const { groupId, memberId, shares } = action.payload;

        const group = state.entities[groupId];
        if (group) {
          // Remove member from the list using member.id
          group.members = group.members.filter((m) => m.id !== memberId);
          // Update shares
          group.shares = shares;
          group.totalMonthlyBudget = shares.totalExpenses;
        }
      })
      .addCase(removeMemberFromGroup.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Erreur lors de la suppression du membre";
      })
      // Add expense to group
      .addCase(addExpenseToGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addExpenseToGroup.fulfilled, (state, action) => {
        state.loading = false;
        const { groupId, expense, shares } = action.payload;

        const group = state.entities[groupId];
        if (group) {
          // Add new expense to the list
          group.expenses.push(expense);
          // Update shares
          group.shares = shares;
          group.totalMonthlyBudget = shares.totalExpenses;
        }

        // Fermer le formulaire
        state.addExpenseForm = null;
      })
      .addCase(addExpenseToGroup.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Erreur lors de l'ajout de la dépense";
      })
      // Delete expense from group
      .addCase(deleteExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.loading = false;
        const { groupId, expenseId, shares } = action.payload;

        const group = state.entities[groupId];
        if (group) {
          // Remove expense from the list
          group.expenses = group.expenses.filter((e) => e.id !== expenseId);
          // Update shares
          group.shares = shares;
          group.totalMonthlyBudget = shares.totalExpenses;
        }
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Erreur lors de la suppression de la dépense";
      })
      // Load single group by ID (for refresh)
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
        state.error =
          action.error.message || "Erreur lors du rechargement du groupe";
      })
      // Leave group (self-removal)
      .addCase(leaveGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.loading = false;
        const { groupId } = action.payload;

        // Remove group from entities
        groupsAdapter.removeOne(state, groupId);
      })
      .addCase(leaveGroup.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Erreur lors de la sortie du groupe";
      })
      // Delete group (creator only)
      .addCase(deleteGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.loading = false;
        const { groupId } = action.payload;

        // Remove group from entities
        groupsAdapter.removeOne(state, groupId);
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Erreur lors de la suppression du groupe";
      })
      // Create group
      .addCase(createGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, _action) => {
        state.loading = false;
        // Group will be loaded via loadUserGroups or loadGroupById
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Erreur lors de la création du groupe";
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

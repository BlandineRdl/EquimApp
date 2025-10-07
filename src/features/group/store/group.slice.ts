import type { EntityState } from "@reduxjs/toolkit";
import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import { completeOnboarding } from "../../onboarding/usecases/complete-onboarding/completeOnboarding.usecase";
import type { Group, InvitationDetails } from "../domain/group.model";
import { addMemberToGroup } from "../usecases/add-member/addMember.usecase";
import { acceptInvitation } from "../usecases/invitation/acceptInvitation.usecase";
import { generateInviteLink } from "../usecases/invitation/generateInviteLink.usecase";
import { getInvitationDetails } from "../usecases/invitation/getInvitationDetails.usecase";
import { refuseInvitation } from "../usecases/invitation/refuseInvitation.usecase";
import { loadUserGroups } from "../usecases/load-groups/loadGroups.usecase";

interface AddMemberForm {
  groupId: string;
  pseudo: string;
  monthlyIncome: string;
}

export const groupsAdapter = createEntityAdapter<Group>();

interface GroupState extends EntityState<Group, string> {
  loading: boolean;
  error: string | null;
  addMemberForm: AddMemberForm | null;
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(completeOnboarding.fulfilled, (state, action) => {
        groupsAdapter.addOne(state, action.payload.group);
      })
      // Charger les groupes utilisateur
      .addCase(loadUserGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserGroups.fulfilled, (state, action) => {
        state.loading = false;
        groupsAdapter.addMany(state, action.payload);
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
        groupsAdapter.upsertOne(state, action.payload);
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
      .addCase(acceptInvitation.fulfilled, (state, action) => {
        state.loading = false;
        groupsAdapter.upsertOne(state, action.payload);
      })
      .addCase(acceptInvitation.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message ||
          "Erreur lors de l'acceptation de l'invitation";
      })
      // Refuse invitation - pas de changement d'état nécessaire
      .addCase(refuseInvitation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refuseInvitation.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(refuseInvitation.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Erreur lors du refus de l'invitation";
      });
  },
});

export const { openAddMemberForm, updateAddMemberForm, closeAddMemberForm } =
  groupSlice.actions;

export const groupReducer = groupSlice.reducer;

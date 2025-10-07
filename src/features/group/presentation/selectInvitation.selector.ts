import type { AppState } from "../../../store/appState";

export const selectInvitationState = (state: AppState) =>
  state.groups.invitation;

export const selectGeneratedInviteLink = (state: AppState) =>
  state.groups.invitation.generateLink.link;

export const selectInviteLinkLoading = (state: AppState) =>
  state.groups.invitation.generateLink.loading;

export const selectInviteLinkError = (state: AppState) =>
  state.groups.invitation.generateLink.error;

export const selectInvitationDetails = (state: AppState) =>
  state.groups.invitation.details.data;

export const selectInvitationDetailsLoading = (state: AppState) =>
  state.groups.invitation.details.loading;

export const selectInvitationDetailsError = (state: AppState) =>
  state.groups.invitation.details.error;

import { createListenerMiddleware } from "@reduxjs/toolkit";
import type { AppState } from "../../../store/appState";

export const userListeners = createListenerMiddleware<AppState>();

// Listeners removed - capacity is now calculated locally in the reducer
// Groups will be reloaded lazily when navigating to home or opening a group

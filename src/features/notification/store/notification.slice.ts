import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Notification,
  NotificationType,
} from "../domain/manage-notifications/notification";

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: [],
};

export const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: {
      prepare: (payload: {
        type: NotificationType;
        title?: string;
        message: string;
      }) => ({
        payload: {
          id: nanoid(),
          timestamp: Date.now(),
          ...payload,
        } as Notification,
      }),
      reducer: (state, action: PayloadAction<Notification>) => {
        state.notifications.push(action.payload);
      },
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload,
      );
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { addNotification, removeNotification, clearAllNotifications } =
  notificationSlice.actions;
export const notificationReducer = notificationSlice.reducer;

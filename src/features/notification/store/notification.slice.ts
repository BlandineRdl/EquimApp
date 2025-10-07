// src/features/notification/store/notification.slice.ts
import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

export type NotificationType = "success" | "error" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
}

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
      prepare: (payload: { type: NotificationType; message: string }) => ({
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

// src/features/user/store/user.slice.ts
import { createSlice } from "@reduxjs/toolkit";
import { completeOnboarding } from "../../onboarding/usecases/complete-onboarding/completeOnboarding.usecase";
import type { User } from "../domain/user.model";

interface UserState {
  profile: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(completeOnboarding.fulfilled, (state, action) => {
      state.profile = action.payload.user;
    });
  },
});

export const userReducer = userSlice.reducer;

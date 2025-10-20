import { configureStore } from "@reduxjs/toolkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import authReducer from "../../auth/store/authSlice";
import type { UserGateway } from "../ports/UserGateway";
import { userReducer } from "../store/user.slice";
import { updateUserIncome } from "./updateUserIncome.usecase";

describe("updateUserIncome usecase", () => {
  let store: ReturnType<typeof configureStore>;
  let mockUserGateway: UserGateway;

  beforeEach(() => {
    mockUserGateway = {
      createProfile: vi.fn(),
      getProfileById: vi.fn(),
      updateProfile: vi.fn().mockResolvedValue(undefined),
    };

    store = configureStore({
      reducer: {
        auth: authReducer,
        user: userReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          thunk: {
            extraArgument: {
              userGateway: mockUserGateway,
            },
          },
        }),
    });
  });

  it("should successfully update income with valid value", async () => {
    const result = await store.dispatch(
      updateUserIncome({ userId: "user-123", newIncome: 2500 }),
    );

    expect(result.type).toBe("user/updateIncome/fulfilled");
    expect(result.payload).toEqual({ income: 2500 });
    expect(mockUserGateway.updateProfile).toHaveBeenCalledWith("user-123", {
      income: 2500,
    });
  });

  it("should reject update with income below minimum (zero)", async () => {
    const result = await store.dispatch(
      updateUserIncome({ userId: "user-123", newIncome: 0 }),
    );

    expect(result.type).toBe("user/updateIncome/rejected");
    expect(mockUserGateway.updateProfile).not.toHaveBeenCalled();
  });

  it("should reject update with negative income", async () => {
    const result = await store.dispatch(
      updateUserIncome({ userId: "user-123", newIncome: -100 }),
    );

    expect(result.type).toBe("user/updateIncome/rejected");
    expect(mockUserGateway.updateProfile).not.toHaveBeenCalled();
  });

  it("should reject update with income above maximum", async () => {
    const result = await store.dispatch(
      updateUserIncome({ userId: "user-123", newIncome: 1000000 }),
    );

    expect(result.type).toBe("user/updateIncome/rejected");
    expect(mockUserGateway.updateProfile).not.toHaveBeenCalled();
  });

  it("should reject update with NaN value", async () => {
    const result = await store.dispatch(
      updateUserIncome({ userId: "user-123", newIncome: Number.NaN }),
    );

    expect(result.type).toBe("user/updateIncome/rejected");
    expect(mockUserGateway.updateProfile).not.toHaveBeenCalled();
  });

  it("should handle gateway errors", async () => {
    mockUserGateway.updateProfile = vi
      .fn()
      .mockRejectedValue(new Error("Network error"));

    const result = await store.dispatch(
      updateUserIncome({ userId: "user-123", newIncome: 2500 }),
    );

    expect(result.type).toBe("user/updateIncome/rejected");
  });

  it("should accept income at minimum boundary (1)", async () => {
    const result = await store.dispatch(
      updateUserIncome({ userId: "user-123", newIncome: 1 }),
    );

    expect(result.type).toBe("user/updateIncome/fulfilled");
    expect(mockUserGateway.updateProfile).toHaveBeenCalledWith("user-123", {
      income: 1,
    });
  });

  it("should accept income at maximum boundary (999999)", async () => {
    const result = await store.dispatch(
      updateUserIncome({ userId: "user-123", newIncome: 999999 }),
    );

    expect(result.type).toBe("user/updateIncome/fulfilled");
    expect(mockUserGateway.updateProfile).toHaveBeenCalledWith("user-123", {
      income: 999999,
    });
  });
});

import type { AppState } from "../store/appState";
import type { Dependencies } from "../store/buildReduxStore";

/**
 * Structured error type for Redux Toolkit async thunks
 * Used with rejectWithValue() to provide type-safe error handling
 */
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Reusable ThunkAPI configuration type
 * Provides type-safe access to state, injected dependencies, and error handling
 *
 * Usage:
 * ```typescript
 * export const myThunk = createAsyncThunk<
 *   ReturnType,
 *   InputType,
 *   AppThunkApiConfig
 * >(...)
 * ```
 */
export interface AppThunkApiConfig {
  state: AppState;
  extra: Dependencies;
  rejectValue: AppError;
}

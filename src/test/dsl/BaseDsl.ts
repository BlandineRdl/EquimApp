/**
 * Base DSL class for test scenarios
 * Provides common utilities and patterns for behavior-driven testing
 */

export abstract class BaseDsl<TResult = unknown, TError = Error> {
  protected result: TResult | null = null;
  protected error: TError | null = null;
  protected setupPromise: Promise<void> | null = null;

  /**
   * Wait for async setup to complete before executing actions
   */
  protected async waitForSetup(): Promise<void> {
    if (this.setupPromise) {
      await this.setupPromise;
      this.setupPromise = null;
    }
  }

  /**
   * Execute an action and capture result or error
   */
  protected async executeAction<T>(
    action: () => Promise<T>,
  ): Promise<T | null> {
    await this.waitForSetup();

    try {
      this.result = (await action()) as TResult;
      this.error = null;
      return this.result as T;
    } catch (error) {
      this.error = error as TError;
      this.result = null;
      return null;
    }
  }

  /**
   * Assert that operation succeeded
   */
  thenShouldSucceed(): this {
    if (this.error) {
      throw new Error(
        `Expected success but got error: ${(this.error as Error).message}`,
      );
    }

    if (this.result === null) {
      throw new Error("Expected a result but got null");
    }

    return this;
  }

  /**
   * Assert that operation failed with specific error message
   */
  thenShouldFailWithError(expectedMessage: string): this {
    if (!this.error) {
      throw new Error("Expected an error but operation succeeded");
    }

    const errorMessage = (this.error as Error).message;
    if (!errorMessage.includes(expectedMessage)) {
      throw new Error(
        `Expected error message to contain "${expectedMessage}", but got "${errorMessage}"`,
      );
    }

    return this;
  }

  /**
   * Get the result of the last operation
   */
  getResult(): TResult | null {
    return this.result;
  }

  /**
   * Get the error of the last operation
   */
  getError(): TError | null {
    return this.error;
  }

  /**
   * Reset the DSL state
   */
  reset(): this {
    this.result = null;
    this.error = null;
    this.setupPromise = null;
    return this;
  }
}

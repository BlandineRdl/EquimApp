/**
 * Rate limiter with persistent storage
 * Implements exponential backoff for failed attempts
 */

interface RateLimitData {
  attempts: number;
  lastAttempt: number;
  blockedUntil: number | null;
}

const STORAGE_PREFIX = "@ratelimit:";

// In-memory storage as fallback for Expo Go
const memoryStorage = new Map<string, string>();

// Dynamic import of AsyncStorage
type AsyncStorageType = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

let AsyncStorage: AsyncStorageType | null = null;
try {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch (_e) {
  // Silent: Expected in Expo Go, using in-memory storage fallback
}

export class RateLimiter {
  private key: string;
  private maxAttempts: number;
  private baseDelayMs: number;

  constructor(
    key: string,
    maxAttempts: number = 5,
    baseDelayMs: number = 1000,
  ) {
    this.key = `${STORAGE_PREFIX}${key}`;
    this.maxAttempts = maxAttempts;
    this.baseDelayMs = baseDelayMs;
  }

  private async getData(): Promise<RateLimitData> {
    try {
      let data: string | null = null;

      if (AsyncStorage) {
        data = await AsyncStorage.getItem(this.key);
      } else {
        data = memoryStorage.get(this.key) || null;
      }

      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      // If we can't read from storage, allow the attempt
      console.error("RateLimiter: Error reading from storage", error);
    }

    return {
      attempts: 0,
      lastAttempt: 0,
      blockedUntil: null,
    };
  }

  private async setData(data: RateLimitData): Promise<void> {
    try {
      const stringData = JSON.stringify(data);

      if (AsyncStorage) {
        await AsyncStorage.setItem(this.key, stringData);
      } else {
        memoryStorage.set(this.key, stringData);
      }
    } catch (error) {
      console.error("RateLimiter: Error writing to storage", error);
    }
  }

  /**
   * Check if an action is allowed
   * Returns { allowed: boolean, retryAfter?: number }
   */
  async canAttempt(): Promise<{ allowed: boolean; retryAfter?: number }> {
    const data = await this.getData();
    const now = Date.now();

    // Check if currently blocked
    if (data.blockedUntil && now < data.blockedUntil) {
      const retryAfter = Math.ceil((data.blockedUntil - now) / 1000);
      return { allowed: false, retryAfter };
    }

    // If blocked period expired, reset
    if (data.blockedUntil && now >= data.blockedUntil) {
      await this.reset();
      return { allowed: true };
    }

    return { allowed: true };
  }

  /**
   * Record a failed attempt
   * Implements exponential backoff
   */
  async recordFailure(): Promise<void> {
    const data = await this.getData();
    const now = Date.now();

    const newAttempts = data.attempts + 1;

    // Calculate block duration using exponential backoff
    // Block for: baseDelay * 2^(attempts - maxAttempts)
    // Example with baseDelay=1000, maxAttempts=5:
    // - Attempt 1-5: No block
    // - Attempt 6: 1s block (1000 * 2^1)
    // - Attempt 7: 2s block (1000 * 2^2)
    // - Attempt 8: 4s block (1000 * 2^3)
    // - etc.
    let blockedUntil: number | null = null;
    if (newAttempts >= this.maxAttempts) {
      const exponent = newAttempts - this.maxAttempts + 1;
      const delayMs = this.baseDelayMs * 2 ** exponent;
      // Cap at 5 minutes
      const cappedDelayMs = Math.min(delayMs, 5 * 60 * 1000);
      blockedUntil = now + cappedDelayMs;
    }

    await this.setData({
      attempts: newAttempts,
      lastAttempt: now,
      blockedUntil,
    });
  }

  /**
   * Record a successful attempt and reset the counter
   */
  async recordSuccess(): Promise<void> {
    await this.reset();
  }

  /**
   * Reset the rate limiter
   */
  async reset(): Promise<void> {
    await this.setData({
      attempts: 0,
      lastAttempt: 0,
      blockedUntil: null,
    });
  }

  /**
   * Get current rate limit status
   */
  async getStatus(): Promise<RateLimitData> {
    return await this.getData();
  }
}

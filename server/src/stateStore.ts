import crypto from "node:crypto";

interface StateRecord {
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

export class OAuthStateStore {
  private states = new Map<string, StateRecord>();
  private defaultTtlMs: number;

  constructor(defaultTtlMs = 10 * 60 * 1000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  /**
   * Generates a cryptographically random, unpredictable state token and records it.
   */
  generateState(ttlMs = this.defaultTtlMs): string {
    this.cleanup();
    const token = crypto.randomBytes(32).toString("base64url");
    const now = Date.now();

    this.states.set(token, {
      createdAt: now,
      expiresAt: now + ttlMs,
      used: false,
    });

    return token;
  }

  /**
   * Validates and single-use consumes a state token.
   */
  consumeState(token: string): { valid: boolean; reason?: string } {
    if (!token || typeof token !== "string") {
      return { valid: false, reason: "Missing or invalid state parameter." };
    }

    const record = this.states.get(token);
    if (!record) {
      return { valid: false, reason: "Unknown or invalid OAuth state." };
    }

    if (Date.now() > record.expiresAt) {
      this.states.delete(token);
      return { valid: false, reason: "OAuth state has expired. Please initiate login again." };
    }

    if (record.used) {
      this.states.delete(token);
      return { valid: false, reason: "OAuth state has already been used (replay detected)." };
    }

    // Invalidate immediately after use
    record.used = true;
    this.states.delete(token);

    return { valid: true };
  }

  /**
   * Removes expired state records to avoid memory leaks.
   */
  cleanup(): void {
    const now = Date.now();
    for (const [token, record] of this.states.entries()) {
      if (now > record.expiresAt || record.used) {
        this.states.delete(token);
      }
    }
  }

  /**
   * Returns current active entry count (for testing/monitoring).
   */
  size(): number {
    return this.states.size;
  }

  /**
   * Clears all stored states (useful for test resets).
   */
  clear(): void {
    this.states.clear();
  }
}

export const defaultStateStore = new OAuthStateStore();

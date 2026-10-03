export class GitHubNetworkError extends Error {
  constructor(message = "Unable to reach GitHub. Please check your network connection.") {
    super(message);
    this.name = "GitHubNetworkError";
  }
}

export interface GitHubApiErrorOptions {
  message: string;
  status: number;
  rateLimitLimit?: number | null;
  rateLimitRemaining?: number | null;
  rateLimitReset?: number | null;
  documentationUrl?: string | null;
}

export class GitHubApiError extends Error {
  readonly status: number;
  readonly rateLimitLimit: number | null;
  readonly rateLimitRemaining: number | null;
  readonly rateLimitReset: number | null;
  readonly documentationUrl: string | null;
  readonly isRateLimit: boolean;

  constructor({
    message,
    status,
    rateLimitLimit = null,
    rateLimitRemaining = null,
    rateLimitReset = null,
    documentationUrl = null,
  }: GitHubApiErrorOptions) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
    this.rateLimitLimit = rateLimitLimit;
    this.rateLimitRemaining = rateLimitRemaining;
    this.rateLimitReset = rateLimitReset;
    this.documentationUrl = documentationUrl;

    const lowerMessage = message.toLowerCase();
    this.isRateLimit =
      status === 429 ||
      (status === 403 &&
        (rateLimitRemaining === 0 ||
          lowerMessage.includes("rate limit") ||
          lowerMessage.includes("secondary rate limit")));
  }

  getResetDate(): Date | null {
    if (this.rateLimitReset) {
      const date = new Date(this.rateLimitReset * 1000);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return null;
  }

  getFormattedResetTime(): string | null {
    const date = this.getResetDate();
    if (!date) return null;
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  getFriendlyMessage(): string {
    if (this.isRateLimit) {
      const resetTime = this.getFormattedResetTime();
      return resetTime
        ? `GitHub API rate limit reached. Try again after ${resetTime}.`
        : "GitHub API rate limit reached. Please try again later.";
    }

    if (this.status === 401) {
      return "GitHub authentication expired or invalid. Please sign in again.";
    }

    if (this.status === 403) {
      return "You don't have permission to perform this action.";
    }

    if (this.status === 404) {
      return "Requested resource was not found on GitHub.";
    }

    if (this.status === 422) {
      return this.message || "Validation failed for this request.";
    }

    if (this.status >= 500) {
      return "GitHub service is temporarily unavailable. Please try again later.";
    }

    return this.message || "An unexpected GitHub error occurred.";
  }
}

export function formatGitHubError(err: unknown, fallbackMessage = "An error occurred."): string {
  if (err instanceof GitHubApiError) {
    return err.getFriendlyMessage();
  }
  if (err instanceof GitHubNetworkError) {
    return err.message;
  }
  if (err instanceof Error) {
    const lower = err.message.toLowerCase();
    if (lower.includes("network") || lower.includes("failed to fetch")) {
      return "Unable to reach GitHub. Please check your network connection.";
    }
    return err.message;
  }
  return fallbackMessage;
}

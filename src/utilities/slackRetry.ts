/**
 * Retry utility for Slack API calls with exponential backoff
 * Handles rate limits (429) and transient server errors (5xx)
 */

import { prettyPrint } from './prettyPrint';

export interface RetryOptions {
  maxRetries?: number; // Default: 3
  initialDelayMs?: number; // Default: 15000ms (15 seconds) - Not used with linear backoff
  maxDelayMs?: number; // Default: 60000ms (60 seconds)
  backoffMultiplier?: number; // Default: 2 - Not used with linear backoff
  onRetryStart?: (attempt: number, delayMs: number, error: Error) => void;
  onRetrySuccess?: () => void;
  onRetryFailure?: (error: Error) => void;
  onCancelled?: () => void;
}

export interface RetryState {
  isRetrying: boolean;
  currentAttempt: number;
  maxAttempts: number;
  delayMs: number;
  error?: Error;
}

interface ParsedSlackError {
  isRateLimitError: boolean;
  isServerError: boolean;
  isRetryable: boolean;
  retryAfterSeconds?: number;
  originalError: Error;
}

/**
 * Parse Slack error to determine if it's retryable and extract retry information
 */
function parseSlackError(error: Error): ParsedSlackError {
  const message = error.message || '';

  // Check for rate limit error (429)
  const isRateLimitError =
    message.includes('ERROR_RATE_LIMIT') || message.includes('rate_limited');

  // Check for server errors (5xx)
  const isServerError =
    message.includes('ERROR_SLACK_API_DOWN') ||
    message.includes('ERROR_HTTP_5') ||
    message.includes('503') ||
    message.includes('500') ||
    message.includes('502') ||
    message.includes('504');

  // Check for network errors
  const isNetworkError =
    message.includes('ERROR_NETWORK') ||
    message.includes('Failed to fetch') ||
    message.includes('Network request failed');

  const isRetryable = isRateLimitError || isServerError || isNetworkError;

  // Try to extract retry-after value from error message
  // Expected format from Apex: "ERROR_RATE_LIMIT:retry_after=30:Too many requests..."
  let retryAfterSeconds: number | undefined;
  if (isRateLimitError && message.includes('retry_after=')) {
    const match = message.match(/retry_after=(\d+)/);
    if (match && match[1]) {
      retryAfterSeconds = parseInt(match[1], 10);
    }
  }

  return {
    isRateLimitError,
    isServerError,
    isRetryable,
    retryAfterSeconds,
    originalError: error
  };
}

/**
 * Calculate delay with linear backoff and jitter
 * Uses 15s increments: 15s, 30s, 45s, 60s (capped at 60s)
 */
function calculateBackoffDelay(
  attempt: number,
  options: Required<RetryOptions>,
  retryAfterSeconds?: number
): number {
  // If we have a Retry-After value from Slack, use it (capped at maxDelay)
  if (retryAfterSeconds !== undefined && retryAfterSeconds > 0) {
    const retryAfterMs = retryAfterSeconds * 1000;
    prettyPrint(
      `[slackRetry] Using Retry-After header: ${retryAfterSeconds}s`,
      null,
      'yellow'
    );
    return Math.min(retryAfterMs, options.maxDelayMs);
  }

  // Linear backoff: 15s, 30s, 45s, 60s (capped at 60s)
  // attempt is 1-based when this is called (1, 2, 3, ...)
  const baseDelaySeconds = Math.min(attempt * 15, 60);
  const baseDelay = baseDelaySeconds * 1000;

  // Add jitter (randomization between 0-25% of base delay)
  // This prevents "thundering herd" when multiple users retry simultaneously
  const jitter = Math.random() * baseDelay * 0.25;
  const delayWithJitter = baseDelay + jitter;

  prettyPrint(
    `[slackRetry] Fallback delay: ${baseDelaySeconds}s (attempt ${attempt})`,
    null,
    'yellow'
  );

  // Cap at maximum delay
  return Math.min(delayWithJitter, options.maxDelayMs);
}

/**
 * Sleep utility using Promise with cancellation support
 */
function sleep(ms: number, cancelToken: { cancelled: boolean }): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (cancelToken.cancelled) {
        reject(new Error('Retry cancelled by user'));
      } else {
        resolve();
      }
    }, ms);

    // Check cancellation periodically during sleep
    const checkInterval = setInterval(() => {
      if (cancelToken.cancelled) {
        clearTimeout(timeoutId);
        clearInterval(checkInterval);
        reject(new Error('Retry cancelled by user'));
      }
    }, 100); // Check every 100ms

    // Clean up interval when timeout completes
    setTimeout(() => clearInterval(checkInterval), ms);
  });
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @param cancelToken - Token to cancel retry operation
 * @returns The result of the function call
 * @throws The last error if all retries are exhausted or operation is cancelled
 *
 * @example
 * const cancelToken = { cancelled: false };
 * const result = await retryWithBackoff(
 *   () => apiClient.slackPostMessage({ channel: 'C123', text: 'Hello' }),
 *   {
 *     maxRetries: 3,
 *     onRetryStart: (attempt, delay) => console.log(`Retry ${attempt} in ${delay}ms`)
 *   },
 *   cancelToken
 * );
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  cancelToken: { cancelled: boolean } = { cancelled: false }
): Promise<T> {
  // Set defaults
  const opts: Required<RetryOptions> = {
    maxRetries: options.maxRetries ?? 3,
    initialDelayMs: options.initialDelayMs ?? 15000, // Not used with linear backoff
    maxDelayMs: options.maxDelayMs ?? 60000, // 60 seconds max
    backoffMultiplier: options.backoffMultiplier ?? 2, // Not used with linear backoff
    onRetryStart: options.onRetryStart ?? (() => {}),
    onRetrySuccess: options.onRetrySuccess ?? (() => {}),
    onRetryFailure: options.onRetryFailure ?? (() => {}),
    onCancelled: options.onCancelled ?? (() => {})
  };

  let lastError: Error;
  let attemptedRetry = false;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    // Check if cancelled before attempting
    if (cancelToken.cancelled) {
      prettyPrint('[slackRetry] Operation cancelled by user', null, 'yellow');
      opts.onCancelled();
      throw new Error('Operation cancelled by user');
    }

    try {
      // Attempt the API call
      const result = await fn();

      // If we retried and succeeded, call success callback
      if (attemptedRetry) {
        prettyPrint('[slackRetry] Retry succeeded!', null, 'green');
        opts.onRetrySuccess();
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      // Parse the error to see if it's retryable
      const parsedError = parseSlackError(lastError);

      // Check if this is the last attempt
      const isLastAttempt = attempt >= opts.maxRetries;

      // Don't retry if:
      // 1. Error is not retryable (auth, permission, validation errors)
      // 2. We've exhausted all retries
      if (!parsedError.isRetryable || isLastAttempt) {
        prettyPrint(
          `[slackRetry] ${isLastAttempt ? 'Max retries exhausted' : 'Non-retryable error'}`,
          lastError,
          'red'
        );
        if (attemptedRetry) {
          opts.onRetryFailure(lastError);
        }
        throw lastError;
      }

      // Calculate backoff delay
      const delayMs = calculateBackoffDelay(attempt, opts, parsedError.retryAfterSeconds);

      attemptedRetry = true;

      // Log retry attempt
      prettyPrint(
        `[slackRetry] Attempt ${attempt + 1}/${opts.maxRetries} failed. ` +
          `Retrying in ${(delayMs / 1000).toFixed(1)}s...`,
        {
          error: lastError.message,
          isRateLimit: parsedError.isRateLimitError,
          isServerError: parsedError.isServerError
        },
        'yellow'
      );

      // Call the onRetryStart callback
      opts.onRetryStart(attempt + 1, delayMs, lastError);

      // Wait before retrying (with cancellation support)
      try {
        await sleep(delayMs, cancelToken);
      } catch (cancelError) {
        // User cancelled during sleep
        opts.onCancelled();
        throw cancelError;
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  opts.onRetryFailure(lastError!);
  throw lastError!;
}

/**
 * Wrapper to create a retryable version of any Slack API function
 *
 * @example
 * const retryablePostMessage = makeRetryable(
 *   (params) => apiClient.slackPostMessage(params)
 * );
 * await retryablePostMessage({ channel: 'C123', text: 'Hello' });
 */
export function makeRetryable<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options?: RetryOptions
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => retryWithBackoff(() => fn(...args), options);
}

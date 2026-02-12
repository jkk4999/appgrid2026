/**
 * useSlackRetry Hook
 * Manages retry state and dialog visibility for Slack API calls
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { retryWithBackoff, RetryOptions } from '../utilities/slackRetry';
import { SlackRetryDialog } from '../components/common/SlackRetryDialog';
import { prettyPrint } from '../utilities/prettyPrint';

interface RetryState {
  isOpen: boolean;
  currentAttempt: number;
  maxAttempts: number;
  delayMs: number;
  errorMessage?: string;
}

interface SlackRetryContextValue {
  executeWithRetry: <T>(
    fn: () => Promise<T>,
    options?: RetryOptions
  ) => Promise<T>;
}

const SlackRetryContext = createContext<SlackRetryContextValue | undefined>(undefined);

/**
 * Provider component that wraps the app and provides retry functionality
 */
export const SlackRetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [retryState, setRetryState] = useState<RetryState>({
    isOpen: false,
    currentAttempt: 0,
    maxAttempts: 3,
    delayMs: 0,
    errorMessage: undefined
  });

  const cancelTokenRef = useRef({ cancelled: false });

  const handleCancel = useCallback(() => {
    prettyPrint('[useSlackRetry] User cancelled retry operation', null, 'yellow');
    cancelTokenRef.current.cancelled = true;
    setRetryState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleOk = useCallback(() => {
    prettyPrint('[useSlackRetry] User acknowledged retry dialog', null, 'blue');
    // Dialog stays open, just acknowledging the wait
  }, []);

  const executeWithRetry = useCallback(
    async <T,>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> => {
      // Reset cancel token for this operation
      cancelTokenRef.current = { cancelled: false };

      const maxRetries = options?.maxRetries ?? 3;

      return retryWithBackoff<T>(
        fn,
        {
          ...options,
          maxRetries,
          onRetryStart: (attempt, delayMs, error) => {
            prettyPrint(
              `[useSlackRetry] Retry started - Attempt ${attempt}/${maxRetries}`,
              { delayMs, error: error.message },
              'yellow'
            );

            // Show dialog when retry starts
            setRetryState({
              isOpen: true,
              currentAttempt: attempt,
              maxAttempts: maxRetries,
              delayMs,
              errorMessage: error.message
            });

            // Call user's onRetryStart if provided
            if (options?.onRetryStart) {
              options.onRetryStart(attempt, delayMs, error);
            }
          },
          onRetrySuccess: () => {
            prettyPrint('[useSlackRetry] Retry succeeded - closing dialog', null, 'green');

            // Close dialog on success
            setRetryState((prev) => ({ ...prev, isOpen: false }));

            // Call user's onRetrySuccess if provided
            if (options?.onRetrySuccess) {
              options.onRetrySuccess();
            }
          },
          onRetryFailure: (error) => {
            prettyPrint(
              '[useSlackRetry] Retry failed after all attempts',
              { error: error.message },
              'red'
            );

            // Close dialog on failure (error will be thrown and handled by caller)
            setRetryState((prev) => ({ ...prev, isOpen: false }));

            // Call user's onRetryFailure if provided
            if (options?.onRetryFailure) {
              options.onRetryFailure(error);
            }
          },
          onCancelled: () => {
            prettyPrint('[useSlackRetry] Retry cancelled by user', null, 'yellow');

            // Close dialog on cancel
            setRetryState((prev) => ({ ...prev, isOpen: false }));

            // Call user's onCancelled if provided
            if (options?.onCancelled) {
              options.onCancelled();
            }
          }
        },
        cancelTokenRef.current
      );
    },
    []
  );

  return (
    <SlackRetryContext.Provider value={{ executeWithRetry }}>
      {children}
      <SlackRetryDialog
        open={retryState.isOpen}
        currentAttempt={retryState.currentAttempt}
        maxAttempts={retryState.maxAttempts}
        delayMs={retryState.delayMs}
        errorMessage={retryState.errorMessage}
        onCancel={handleCancel}
        onOk={handleOk}
      />
    </SlackRetryContext.Provider>
  );
};

/**
 * Hook to access retry functionality
 * Must be used within SlackRetryProvider
 */
export const useSlackRetry = (): SlackRetryContextValue => {
  const context = useContext(SlackRetryContext);
  if (!context) {
    throw new Error('useSlackRetry must be used within SlackRetryProvider');
  }
  return context;
};

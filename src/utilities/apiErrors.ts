import type { JSX } from 'react';

import { ApiTimeoutError } from '../brideDesignPattern/sfdcClient';

export interface ErrorNotifyOptions {
  enqueueSnackbar?: (msg: string, opts: { action?: (key?: any) => JSX.Element; variant: 'error' | 'warning' | 'info' | 'success'; autoHideDuration?: number | null }) => void;
  action?: (key?: any) => JSX.Element;
  prefix?: string;
  log?: boolean; // default true
}

export interface RunApiOptions<T = any> extends ErrorNotifyOptions {
  rethrow?: boolean; // default true
  defaultValue?: T; // used only if rethrow is false
}

export function getErrorMessage(err: any, fallback = 'Unexpected error'): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;

  // Special handling for timeout errors
  if (err instanceof ApiTimeoutError) {
    return err.message;
  }

  const m =
    (err &&
      (err.message ||
        err.msg ||
        err.error ||
        err.errorMessage ||
        err.body?.message ||
        err.body?.error?.message ||
        err.response?.body?.message ||
        err.response?.data?.message)) ||
    '';
  return m || fallback;
}

export function isTimeoutError(err: any): boolean {
  return err instanceof ApiTimeoutError || err?.name === 'ApiTimeoutError';
}

export function notifyError(message: string, opts?: ErrorNotifyOptions & { isTimeout?: boolean }) {
  const { enqueueSnackbar, action, log = true, prefix, isTimeout } = opts || {};
  const msg = prefix ? `${prefix}: ${message}` : message;
  if (log) {
    console.error(msg);
  }
  // Timeout errors should persist until dismissed
  enqueueSnackbar?.(msg, { action, variant: 'error', autoHideDuration: isTimeout ? null : undefined });
}

export async function runApi<T>(fn: () => Promise<T>, opts?: RunApiOptions<T>): Promise<T> {
  const { rethrow = true } = opts || {};
  try {
    return await fn();
  } catch (e: any) {
    const msg = getErrorMessage(e);
    const isTimeout = isTimeoutError(e);
    notifyError(msg, { ...opts, isTimeout });
    if (rethrow) {
      throw e; // Preserve original error type
    }
    return (opts?.defaultValue as T);
  }
}

// Factory to bind snackbar/action (and defaults) once per component
export function makeApiRunner(base: ErrorNotifyOptions & { rethrow?: boolean } = {}) {
  return async function run<T>(fn: () => Promise<T>, opts?: Omit<RunApiOptions<T>, 'enqueueSnackbar' | 'action' | 'rethrow'> & { rethrow?: boolean }): Promise<T> {
    return runApi(fn, { ...base, ...(opts || {}), enqueueSnackbar: base.enqueueSnackbar, action: base.action, rethrow: opts?.rethrow ?? base.rethrow });
  };
}

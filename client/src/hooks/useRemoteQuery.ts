import { useEffect, useState } from 'react';
import { errorMessage } from '../lib/utils';

type Request<T> = (signal: AbortSignal) => Promise<T>;
type Result<T> = { request: Request<T>; attempt: number; data?: T; error?: string; errorCode?: string; updatedAt?: string };

export function useRemoteQuery<T>(request: Request<T> | null) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();
    request(controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ request, attempt, data, updatedAt: new Date().toISOString() });
    }, error => {
      const errorCode = error && typeof error === 'object' && 'error' in error && typeof error.error === 'string' ? error.error : undefined;
      if (!controller.signal.aborted) setResult({ request, attempt, error: errorMessage(error, 'データを取得できませんでした。'), errorCode });
    });
    return () => controller.abort();
  }, [request, attempt]);
  const current = result?.request === request && result?.attempt === attempt ? result : null;
  return { data: current?.data, error: current?.error, errorCode: current?.errorCode, updatedAt: current?.updatedAt, loading: Boolean(request && !current), retry: () => setAttempt(n => n + 1) };
}

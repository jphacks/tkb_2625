import { useEffect, useState } from 'react';
import { errorMessage } from '../lib/utils';

type Request<T> = (signal: AbortSignal) => Promise<T>;
type Result<T> = { request: Request<T>; attempt: number; data?: T; error?: string; updatedAt?: string };

export function useRemoteQuery<T>(request: Request<T> | null) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();
    request(controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ request, attempt, data, updatedAt: new Date().toISOString() });
    }, error => {
      if (!controller.signal.aborted) setResult({ request, attempt, error: errorMessage(error, 'データを取得できませんでした。') });
    });
    return () => controller.abort();
  }, [request, attempt]);
  const current = result?.request === request && result?.attempt === attempt ? result : null;
  return { data: current?.data, error: current?.error, updatedAt: current?.updatedAt, loading: Boolean(request && !current), retry: () => setAttempt(n => n + 1) };
}

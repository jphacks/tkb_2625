import { useEffect, useRef, useState } from 'react';
import { errorMessage } from './utils';
import type { Execute } from './types';

export function useAction({ execute, notify }: { execute: Execute; notify: (message: string) => void }) {
  const [error, setError] = useState('');
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function run(args: Parameters<Execute>, message: string) {
    setError('');
    try { await execute(...args); notify(message); return true; }
    catch (e) { if (mounted.current) setError(errorMessage(e)); return false; }
  }
  return { run, error };
}

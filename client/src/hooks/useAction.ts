import { useEffect, useRef, useState } from 'react';
import { errorMessage } from '../lib/utils';

/** 非同期の操作を実行し、失敗時のエラー表示と多重実行の防止を受け持つ */
export function useAction() {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function run(operation: () => Promise<unknown>) {
    if (pending) return false;
    setError(''); setPending(true);
    try { await operation(); return true; }
    catch (e) { if (mounted.current) setError(errorMessage(e)); return false; }
    finally { if (mounted.current) setPending(false); }
  }
  return { run, error, pending };
}

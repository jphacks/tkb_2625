import { useCallback, useEffect, useRef, useState } from 'react';
import { createDemoService } from './service';
import type { Execute, Snapshot } from './types';

// 通信や保存の方法はサービス側に閉じ込め、画面には確定済みの応答だけを渡す。
export function useRogaining(createService = createDemoService) {
  const [service] = useState(createService);
  const [state, setState] = useState<Snapshot | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(false);
  const activeCommand = useRef(false);
  useEffect(() => {
    let active = true;
    mounted.current = true;
    setLoading(true);
    setError('');
    service.load().then(result => {
      if (active) { setState(result.state); setNotice(result.warning); }
    }).catch(reason => { if (active) setError(reason.message || 'データを取得できませんでした。'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; mounted.current = false; };
  }, [service, attempt]);
  const execute: Execute = useCallback(async (...args: Parameters<Execute>) => {
    if (activeCommand.current) throw new Error('処理中です。完了してから操作してください。');
    activeCommand.current = true;
    setPending(true);
    try {
      const next = await service.execute(...args);
      if (mounted.current) setState(next);
      return next;
    } finally {
      activeCommand.current = false;
      if (mounted.current) setPending(false);
    }
  }, [service]);
  return { state, notice, setNotice, loading, error, pending, execute, retry: () => setAttempt(value => value + 1) };
}

import { useCallback } from 'react';
import type { AtUriString, DidString } from '@atproto/lex';
import { r } from '../lib/lex';
import { useLexClient } from '../lib/lexClient';
import { useRemoteQuery } from './useRemoteQuery';

/** イベント本体と参加チーム (getEvent) */
export function useEvent(event: AtUriString) {
  const client = useLexClient();
  const load = useCallback(async (signal: AbortSignal) => (await client.xrpc(r.getEvent.main, { params: { event }, signal })).body, [client, event]);
  return useRemoteQuery(load);
}

/** イベントのチェックポイント一覧 (getCheckpoints) */
export function useCheckpoints(event: AtUriString) {
  const client = useLexClient();
  const load = useCallback(async (signal: AbortSignal) => (await client.xrpc(r.getCheckpoints.main, { params: { event }, signal })).body.checkpoints, [client, event]);
  return useRemoteQuery(load);
}

/** イベントの提出一覧 (listSubmissions)。カーソルを辿って全件取得する */
export function useSubmissions(event: AtUriString, filter: { checkpoint?: AtUriString; participant?: DidString } = {}) {
  const client = useLexClient();
  const { checkpoint, participant } = filter;
  const load = useCallback(async (signal: AbortSignal) => {
    const submissions = [];
    let cursor: string | undefined;
    do {
      const { body } = await client.xrpc(r.listSubmissions.main, { params: { event, checkpoint, participant, limit: 100, cursor }, signal });
      submissions.push(...body.submissions);
      cursor = body.cursor;
    } while (cursor);
    return submissions;
  }, [client, event, checkpoint, participant]);
  return useRemoteQuery(load);
}

/** ログイン中ユーザーの参加・主催イベント (getMe) */
export function useMe() {
  const client = useLexClient();
  const load = useCallback(async (signal: AbortSignal) => (await client.xrpc(r.getMe.main, { signal })).body, [client]);
  return useRemoteQuery(load);
}

/** イベントのチーム順位 (getRanking) */
export function useRanking(event: AtUriString) {
  const client = useLexClient();
  const load = useCallback(async (signal: AbortSignal) => (await client.xrpc(r.getRanking.main, { params: { event }, signal })).body.ranking, [client, event]);
  return useRemoteQuery(load);
}

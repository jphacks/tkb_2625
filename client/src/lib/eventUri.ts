import type { AtUriString } from '@atproto/lex';
import { useParams } from 'react-router-dom';
import { r } from './lex';

/** イベントの at-uri と URL パス (`/events/:did/:rkey`) を相互変換する */
export function eventPath(uri: string, sub = '') {
  const [, , did, , rkey] = uri.split('/');
  return `/events/${encodeURIComponent(did)}/${encodeURIComponent(rkey)}${sub ? `/${sub}` : ''}`;
}
export function adminEventPath(uri: string, sub = '') {
  return `/admin${eventPath(uri, sub)}`;
}

/** `/events/:did/:rkey` 配下のルートで、パラメータからイベントの at-uri を組み立てる */
export function useEventUri(): AtUriString {
  const { did = '', rkey = '' } = useParams();
  return `at://${did}/${r.event.$type}/${rkey}` as AtUriString;
}

// モックの識別子。HTTPのLAN接続でも動作する。認証トークンには使用しない。
export function createId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `demo-${Date.now().toString(36)}-${++sequence}-${Math.random().toString(36).slice(2)}`;
}
let sequence = 0;

export const errorMessage = (error: unknown, fallback = '処理に失敗しました。') => error instanceof Error ? error.message : fallback;
const dateFormatter = new Intl.DateTimeFormat('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
export const formatDate = (value: string) => dateFormatter.format(new Date(value));
export const normalizeNumber = (value: string, width = 2) => String(Number(value)).padStart(width, '0');

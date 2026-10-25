import { openDatabase, readRecord } from './database';
import { createId } from './utils';
import type { DemoState } from './types';

export const isImageRef = (value: string) => value.startsWith('image:');
const memory = new Map<string, Blob>();
const urls = new Map<string, Promise<string>>();

export function imageReferences(state: DemoState): Set<string> {
  return new Set([...state.checkpoints, ...state.submissions].map(x => x.image).filter(isImageRef));
}

export function separateImages(state: DemoState) {
  const added = new Map<string, Blob>();
  const references = new Map<string, string>();
  function reference(value: string) {
    if (isImageRef(value)) return value;
    const previous = references.get(value);
    if (previous) return previous;
    const match = /^data:(image\/(?:jpeg|png|webp|svg\+xml))(;base64|;charset=utf-8)?,([\s\S]+)$/.exec(value);
    if (!match) throw new Error('画像データが不正です。');
    const decoded = match[2] === ';base64' ? Uint8Array.from(atob(match[3]), c => c.charCodeAt(0)) : new TextEncoder().encode(decodeURIComponent(match[3]));
    const id = `image:${createId()}`;
    added.set(id, new Blob([decoded], { type: match[1] }));
    references.set(value, id);
    return id;
  }
  const next = { ...state, checkpoints: state.checkpoints.map(cp => ({ ...cp, image: reference(cp.image) })), submissions: state.submissions.map(s => ({ ...s, image: reference(s.image) })) };
  return { state: next, added };
}

export function commitMemoryImages(added: Map<string, Blob>, active: Set<string>) {
  for (const id of active) if (!added.has(id) && !memory.has(id)) throw new Error('保存画像が見つかりません。');
  for (const [id, blob] of added) memory.set(id, blob);
  for (const id of memory.keys()) if (!active.has(id)) memory.delete(id);
  releaseImages(active);
}

export function releaseImages(active: Set<string>) {
  for (const [id, promise] of urls) {
    if (!active.has(id)) {
      urls.delete(id);
      void promise.then(url => URL.revokeObjectURL(url), () => {});
    }
  }
}

export async function resolveImage(reference: string): Promise<string> {
  if (!isImageRef(reference)) return reference;
  let cached = urls.get(reference);
  if (!cached) {
    cached = (async () => {
      const blob = memory.get(reference) || await readRecord<Blob>(await openDatabase(), 'images', reference);
      if (!(blob instanceof Blob)) throw new Error('保存画像が見つかりません。');
      return URL.createObjectURL(blob);
    })();
    urls.set(reference, cached);
    cached.catch(() => { if (urls.get(reference) === cached) urls.delete(reference); });
  }
  return cached;
}

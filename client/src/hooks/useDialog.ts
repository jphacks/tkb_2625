import { useEffect, useRef } from 'react';

export function useDialog(identity: string, close: () => void) {
  const dialog = useRef<HTMLDialogElement>(null);
  const restore = useRef(() => {});
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!element.open) previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    let restored = false;
    restore.current = () => {
      if (restored) return;
      restored = true;
      document.body.style.overflow = overflow;
      if (previousFocus.current?.isConnected) previousFocus.current.focus();
    };
    if (!element.open) element.showModal();
    document.body.style.overflow = 'hidden';
    // StrictModeの再セットアップ時に非同期closeイベントを発火させない。
    // アンマウント時はDOM自体が取り除かれる。
    return () => {
      document.body.style.overflow = overflow;
      if (!element.isConnected) restore.current();
    };
  }, [identity]);
  function onClose() {
    if (dialog.current?.open) return;
    restore.current();
    close();
  }
  return { dialog, onClose };
}

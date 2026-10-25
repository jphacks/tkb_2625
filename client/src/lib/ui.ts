// 複数の画面で使う Tailwind のクラス。上書きしたいときは cn(button, 'h-8') のように後ろに足す
// 色は bg / fg / accent のみ。角丸・影は使わない

const buttonBase = 'inline-flex h-9 items-center justify-center gap-1.5 border px-3 text-center text-[13px] leading-none whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40';
export const button = `${buttonBase} border-fg/25 bg-bg text-fg hover:not-disabled:bg-fg/5`;
export const buttonPrimary = `${buttonBase} border-accent bg-accent font-bold text-bg hover:not-disabled:bg-accent/90`;
export const iconButton = 'inline-grid size-9 place-items-center hover:not-disabled:bg-fg/5';
export const textButton = 'inline-flex items-center gap-1 p-0 text-accent hover:underline disabled:cursor-default';

/** 小見出し・ラベル */
export const eyebrow = 'block text-[11px] font-bold text-fg/60';
export const liveDot = 'inline-block size-2 shrink-0 bg-accent';
export const skipLink = 'fixed -top-[100px] left-4 z-[1000] bg-accent p-3 text-bg focus:top-2';

export const mainContainer = 'mx-auto w-full max-w-[1200px] px-4 py-4 max-sm:px-3 max-sm:py-3';
export const empty = 'flex flex-col items-center gap-3 px-4 py-12 text-center text-fg/60 [&_h1]:text-[15px] [&_h1]:font-bold [&_h1]:text-fg [&_h2]:text-[15px] [&_h2]:font-bold [&_h2]:text-fg [&_h3]:text-[14px] [&_h3]:font-bold';

/** 一覧のテーブル */
export const table = 'w-full border-collapse text-[13px] [&_td]:border-b [&_td]:border-fg/10 [&_td]:px-2 [&_td]:py-1.5 [&_th]:border-b [&_th]:border-fg [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-bold [&_th]:whitespace-nowrap [&_th]:text-fg/60';

const panel = 'my-3 items-center gap-2 border-l-4 px-3 py-2 text-[13px]';
export const infoPanel = `${panel} flex border-fg/30 bg-fg/5`;
export const successPanel = `${panel} flex border-accent bg-accent/10`;
export const errorPanel = `${panel} block border-fg bg-fg/5 font-bold [&_*]:font-normal`;
export const errorText = 'mt-2 text-[13px] font-bold text-fg';
export const notice = 'mb-3 flex items-center justify-between gap-3 bg-accent px-3 py-1 text-[13px] whitespace-pre-line text-bg';

export const input = 'h-9 w-full border border-fg/25 bg-bg px-2 text-[13px] text-fg';
export const textarea = 'w-full border border-fg/25 bg-bg px-2 py-1.5 text-[13px] text-fg';
export const fieldLabel = 'mb-1 block text-[11px] font-bold text-fg/60';

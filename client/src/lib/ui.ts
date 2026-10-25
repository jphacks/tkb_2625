// 複数の画面で使う Tailwind のクラス。上書きしたいときは cn(button, 'text-[11px]') のように後ろに足す

const buttonBase = 'inline-flex min-h-11 items-center justify-center gap-2 border px-[17px] py-[11px] text-center text-xs leading-[1.4] disabled:cursor-not-allowed disabled:opacity-50';
export const button = `${buttonBase} border-[#cdd3be] bg-[#faf9f3] hover:not-disabled:bg-[#e9ecdf]`;
export const buttonPrimary = `${buttonBase} border-olive bg-olive text-[#f7f6ef] hover:not-disabled:bg-[#5c6d50]`;
export const iconButton = 'inline-grid min-h-11 min-w-11 place-items-center';
export const textButton = 'inline-flex items-center gap-[5px] p-0 text-olive disabled:cursor-default';

export const eyebrow = 'block text-[10px] font-semibold tracking-[1.8px] text-muted';
export const liveDot = 'inline-block size-1.5 shrink-0 rounded-full bg-[#7d8f62]';
export const skipLink = 'fixed -top-[100px] left-4 z-[1000] bg-olive p-[15px] text-white focus:top-2.5';

export const mainContainer = 'mx-auto min-h-[60vh] max-w-[1160px] px-8 pt-[30px] pb-[45px] xl:pt-9 max-sm:px-3.5 max-sm:pt-5 max-sm:pb-[30px]';
export const empty = 'flex flex-col items-center gap-[18px] px-5 py-[60px] text-center text-muted [&_h3]:text-base [&_h3]:font-medium [&_p]:text-xs';

const panel = 'my-[18px] items-center gap-[9px] px-[17px] py-[15px] text-xs leading-[1.8] max-sm:p-3 max-sm:text-[11px]';
export const infoPanel = `${panel} flex bg-[#e9eddf] text-[#687554]`;
export const successPanel = `${panel} flex bg-[#e3ecdc] text-[#506c40]`;
export const errorPanel = `${panel} block bg-[#f0e4d9] text-[#8c624e] [&_strong]:font-medium`;
export const errorText = 'mt-3 text-xs leading-[1.8] text-[#a1533b]';
export const notice = 'mb-5 flex items-center justify-between gap-3 border-l-3 border-olive bg-[#e6ecde] px-[15px] py-2.5 text-[13px] whitespace-pre-line max-sm:px-2.5 max-sm:py-2 max-sm:text-[11px]';

export const input = 'w-full border border-line bg-paper px-2.5 py-2 text-xs text-ink';

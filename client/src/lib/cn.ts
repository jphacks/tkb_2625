import { twMerge } from 'tailwind-merge';

/** 条件付きでクラスを連結し、競合する Tailwind ユーティリティは後勝ちにする */
export function cn(...classes: (string | false | null | undefined)[]) {
  return twMerge(classes.filter(Boolean).join(' '));
}

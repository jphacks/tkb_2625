export const errorMessage = (error: unknown, fallback = '処理に失敗しました。') => error instanceof Error ? error.message : fallback;
const dateFormatter = new Intl.DateTimeFormat('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
export const formatDate = (value: string) => dateFormatter.format(new Date(value));

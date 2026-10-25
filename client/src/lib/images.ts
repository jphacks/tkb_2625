/** 選択した画像を長辺 1200px 以内の JPEG の Blob にする (lexicon の maxSize 2MB に収める) */
export async function prepareImageBlob(file: File): Promise<Blob> {
  if (!file) throw new Error('画像を選択してください。');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('JPEG・PNG・WebPの画像を選択してください。');
  if (file.size > 8 * 1024 * 1024) throw new Error('8MB以下の画像を選択してください。');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('画像を処理できませんでした。');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.72));
    if (!blob) throw new Error();
    return blob;
  } catch { throw new Error('画像を読み込めませんでした。別の画像を選択してください。'); }
  finally { URL.revokeObjectURL(url); }
}


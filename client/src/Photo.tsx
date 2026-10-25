import { useEffect, useState } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { isImageRef, resolveImage } from './imageStore';

export default function Photo({ src = '', alt = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState({ reference: '', url: '', failed: false });
  useEffect(() => {
    if (!isImageRef(src)) return;
    let active = true;
    resolveImage(src).then(url => { if (active) setLoaded({ reference: src, url, failed: false }); }, () => {
      if (active) setLoaded({ reference: src, url: '', failed: true });
    });
    return () => { active = false; };
  }, [src]);
  const current = loaded.reference === src;
  const url = isImageRef(src) ? (current ? loaded.url : '') : src;
  return <img {...props} src={url || undefined} alt={current && loaded.failed ? `${alt}（画像を読み込めませんでした）` : alt} />;
}

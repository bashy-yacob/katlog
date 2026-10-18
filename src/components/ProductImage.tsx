import { useState } from 'react';

type ProductImageProps = { src?: string; alt: string; fallback?: string; loading?: 'lazy' | 'eager' };

/** Show existing image data, with a quiet fallback if it is absent or unavailable. */
export default function ProductImage({ src, alt, fallback = 'תמונה תתווסף בהמשך', loading = 'lazy' }: ProductImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return src && src !== failedSource
    ? <img src={src} alt={alt} loading={loading} decoding="async" onError={() => setFailedSource(src)} />
    : <span className="image-unavailable">{fallback}</span>;
}

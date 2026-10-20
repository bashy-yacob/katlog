import { getDownloadURL, getMetadata, ref, uploadBytes } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import { validateImageFile } from './validation.ts';

// Content-addressed immutable files make retries safe without deleting shared images.
export async function uploadProductImage(storage: FirebaseStorage, bytes: Uint8Array, type: string) {
  validateImageFile({ size: bytes.byteLength, type });
  const hash = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes));
  const name = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' } as Record<string, string>)[type];
  const target = ref(storage, `products/${name}.${extension}`);
  try {
    const metadata = await getMetadata(target);
    if (metadata.size !== bytes.byteLength || metadata.contentType !== type) throw new Error('Image metadata mismatch');
    return await getDownloadURL(target);
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'storage/object-not-found')) throw error;
  }
  try { await uploadBytes(target, bytes, { contentType: type }); }
  catch (error) {
    // Another tab may have uploaded the exact same immutable object first.
    try {
      const metadata = await getMetadata(target);
      if (metadata.size !== bytes.byteLength || metadata.contentType !== type) throw error;
    } catch { throw error; }
  }
  return getDownloadURL(target);
}

export function decodeDataImage(value: string) {
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(value);
  if (!match || match[2].length > 7 * 1024 * 1024) throw new Error('תמונת המוצר המקומית אינה נתמכת או גדולה מדי.');
  const bytes = Uint8Array.from(atob(match[2]), character => character.charCodeAt(0));
  validateImageFile({ size: bytes.byteLength, type: match[1] });
  return { bytes, type: match[1] };
}

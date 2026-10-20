/**
 * 📤 ImageUpload - Component להעלאת תמונה
 * 
 * מטרה: העלאה של תמונה למוצר (בעלוי או URL)
 * 
 * זרימת נתונים:
 *   1. ProductModal משתמשת בImageUpload
 *      - מעבירה onImageSelect callback
 *      - מעבירה currentImage (אם בעריכה)
 * 
 *   2. משתמש בוחר דרך:
 *      - מצב "URL": הכנס קישור לתמונה ישירות
 *      - מצב "File": בחר קובץ מהמחשב
 * 
 *   3. כשמשתמש בוחר תמונה:
 *      - Preview מוצגת מידית
 *      - onImageSelect(imageData) נקרא עם הנתונים
 *      - ProductModal מקבל את הנתונים בstateה
 * 
 *   4. כשלוחצים "שמור":
 *      - הנתונים של התמונה שמורים יחד עם המוצר
 * 
 * כרגע: שומרים כURL או base64
 * בעתיד: יעלו ל-Firebase Storage
 */
import { useState, useRef, useEffect } from 'react';
import { IMAGE_TYPES, validateImageFile, validImageUrl } from '@/api/catalog/validation';

interface ImageUploadProps {
  onImageSelect: (imageData: string) => void;
  currentImage?: string;
  onBusyChange?: (busy: boolean) => void;
}

export default function ImageUpload({ onImageSelect, currentImage, onBusyChange }: ImageUploadProps) {
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('url');
  const [urlInput, setUrlInput] = useState(currentImage || '');
  const [preview, setPreview] = useState<string>(currentImage || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const readerRef = useRef<FileReader | null>(null);
  useEffect(() => () => { readerRef.current?.abort(); }, []);

  useEffect(() => {
    setPreview(currentImage || '');
    setUrlInput(currentImage?.startsWith('data:') ? '' : currentImage || '');
  }, [currentImage]);

  const handleModeChange = (mode: 'file' | 'url') => {
    setUploadMode(mode);
    // Clear file input when switching to URL mode
    if (mode === 'url' && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try { validateImageFile(file); } catch (cause) { setError(cause instanceof Error ? cause.message : 'קובץ לא תקין'); e.target.value = ''; return; }
      readerRef.current?.abort();
      const reader = new FileReader();
      readerRef.current = reader;
      onBusyChange?.(true); setError('');
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setPreview(imageData);
        setUrlInput(''); // Clear URL input when file is selected
        onImageSelect(imageData);
        onBusyChange?.(false);
      };
      reader.onerror = () => { setError('לא ניתן לקרוא את התמונה. נסי לבחור אותה שוב.'); onBusyChange?.(false); };
      reader.onabort = () => onBusyChange?.(false);
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setUrlInput(url);
    if (validImageUrl(url)) {
      setError('');
      setPreview(url);
      onImageSelect(url);
    } else { setError('הקישור צריך להתחיל ב־HTTPS.'); onImageSelect(url); }
  };

  return (
    <div className="image-upload-container">
      <div className="upload-mode-tabs">
        <button
          type="button"
          className={`tab-btn ${uploadMode === 'url' ? 'active' : ''}`}
          aria-pressed={uploadMode === 'url'}
          onClick={() => handleModeChange('url')}
        >
          קישור URL
        </button>
        <button
          type="button"
          className={`tab-btn ${uploadMode === 'file' ? 'active' : ''}`}
          aria-pressed={uploadMode === 'file'}
          onClick={() => handleModeChange('file')}
        >
          העלאה מהמחשב
        </button>
      </div>

      <div className="upload-content">
        {uploadMode === 'url' ? (
          <div key="url" className="url-input-group">
            <label htmlFor="image-url">קישור לתמונה:</label>
            <input
              id="image-url"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={handleUrlChange}
              className="url-input"
            />
          </div>
        ) : (
          <div key="file" className="file-input-group">
            <label htmlFor="image-file">בחר תמונה מהמחשב:</label>
            <input
              ref={fileInputRef}
              id="image-file"
              type="file"
              accept={IMAGE_TYPES.join(',')}
              onChange={handleFileChange}
              className="file-input"
            />
          </div>
        )}
      </div>

      <p className="form-note">JPEG, PNG, WebP או GIF, עד 5MB. התמונה תועלה בעת שמירת המוצר, ללא שינוי בעיצוב או באיכות.</p>
      {error && <p className="form-error" role="alert">{error}</p>}

      {preview && (
        <div className="image-preview">
          <p>תצוגה מקדימה:</p>
          <img src={preview} alt="תצוגה מקדימה של תמונת המוצר" />
        </div>
      )}
    </div>
  );
}

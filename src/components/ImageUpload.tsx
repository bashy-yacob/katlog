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

interface ImageUploadProps {
  onImageSelect: (imageData: string) => void;
  currentImage?: string;
}

export default function ImageUpload({ onImageSelect, currentImage }: ImageUploadProps) {
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('url');
  const [urlInput, setUrlInput] = useState(currentImage || '');
  const [preview, setPreview] = useState<string>(currentImage || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setPreview(imageData);
        setUrlInput(''); // Clear URL input when file is selected
        onImageSelect(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setUrlInput(url);
    if (url) {
      setPreview(url);
      onImageSelect(url);
    }
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
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
            />
          </div>
        )}
      </div>

      {preview && (
        <div className="image-preview">
          <p>תצוגה מקדימה:</p>
          <img src={preview} alt="תצוגה מקדימה של תמונת המוצר" />
        </div>
      )}
    </div>
  );
}

import { Upload } from 'lucide-react';
import { useRef } from 'react';

export function IconUploader({ iconImage, onUpload }) {
  const inputRef = useRef(null);

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    onUpload(file);
  }

  return (
    <div className="space-y-2">
      <p className="text-lg font-semibold text-gray-900">Icon</p>
      <p className="text-sm text-gray-500">Recommended: 128x128</p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 text-primary-600 hover:bg-gray-200"
      >
        {iconImage ? (
          <img src={iconImage} alt="Community icon" className="h-full w-full object-cover" />
        ) : (
          <span className="text-base font-medium">Upload</span>
        )}
      </button>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex h-11 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <Upload className="h-4 w-4" />
        CHANGE
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="sr-only"
      />
    </div>
  );
}

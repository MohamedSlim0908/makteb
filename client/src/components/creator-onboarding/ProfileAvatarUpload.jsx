import { Camera, UserRound } from 'lucide-react';
import { useId, useRef } from 'react';

export function ProfileAvatarUpload({ previewUrl, onFileSelect }) {
  const inputRef = useRef(null);
  const inputId = useId();

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    onFileSelect(file);
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative inline-flex h-36 w-36 items-center justify-center rounded-full border border-gray-200 bg-gray-100 transition-colors hover:bg-gray-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-100"
        aria-label="Upload profile photo"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Profile preview" className="h-full w-full rounded-full object-cover" />
        ) : (
          <UserRound className="h-16 w-16 text-gray-400" />
        )}

        <span className="absolute bottom-2 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white bg-gray-900 text-white shadow-md transition-transform group-hover:scale-105">
          <Camera className="h-4 w-4" />
        </span>
      </button>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />

      <p className="mt-3 text-sm font-medium text-gray-700">Upload a photo</p>
      <p className="mt-1 text-xs text-gray-500">or import from Google/Facebook</p>
    </div>
  );
}

import React, { useRef, useState } from 'react';
import { Button } from './Button';
import cloudinaryService from '../services/cloudinary.service';

interface ImageUploaderProps {
  onSuccess: (url: string) => void;
  onError: (error: string) => void;
  folder?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onSuccess,
  onError,
  folder = 'general',
  maxSize = 5,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      onError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'matchmeter'); // Change to your preset
      formData.append('folder', folder);

      const response = await cloudinaryService.uploadImage(file, folder);
      onSuccess(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onError(errorMessage);
      setPreview(null);
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
      />

      {preview && (
        <div className="relative w-40 h-40 rounded-lg overflow-hidden border-2 border-gray-300">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="animate-spin">
                <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}

      <Button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        isLoading={uploading}
        variant="outline"
      >
        {preview ? 'Change Image' : 'Choose Image'}
      </Button>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Max size: {maxSize}MB • Formats: JPG, PNG, WebP
      </p>
    </div>
  );
};

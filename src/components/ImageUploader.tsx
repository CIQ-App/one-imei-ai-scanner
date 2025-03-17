import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (imageData: string) => void;
  isProcessing: boolean;
}

export function ImageUploader({ onImageSelect, isProcessing }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setPreview(base64data);
        onImageSelect(base64data);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="space-y-3 sm:space-y-4">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-h-48 sm:max-h-64 mx-auto rounded-lg object-contain" 
            />
            <p className="text-xs sm:text-sm text-gray-500">Click or drag to replace the image</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <Upload className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-gray-400" />
            <div className="space-y-1 sm:space-y-2">
              <p className="text-base sm:text-xl font-medium text-gray-700">
                {isDragActive ? "Drop the image here" : "Upload an image"}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Drag and drop or click to select
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
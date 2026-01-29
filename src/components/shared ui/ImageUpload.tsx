'use client';

import React, { forwardRef, useState, useRef, useImperativeHandle, useEffect } from 'react';
import { RxUpload, RxCross2 } from 'react-icons/rx';
import { ImSpinner2 } from 'react-icons/im';

interface ImageUploadProps {
  label?: string;
  initialImage?: string | null;
  onFileSelect?: (file: File | null) => void;
  isUploading?: boolean;
}

const ImageUpload = forwardRef<HTMLInputElement, ImageUploadProps>(
  ({ label = 'Upload Image', initialImage = null, onFileSelect, isUploading = false }, ref) => {
    const [preview, setPreview] = useState<string | null>(initialImage);
    const [isDragging, setIsDragging] = useState(false);

    // Internal ref for the hidden file input
    const internalInputRef = useRef<HTMLInputElement>(null);

    // Sync external ref if provided
    useImperativeHandle(ref, () => internalInputRef.current!);

    // Handle initial image changes (e.g. when editing different products)
    useEffect(() => {
      setPreview(initialImage);
    }, [initialImage]);

    const handleFile = (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert("Please upload an image file");
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        alert("File size must be less than 4MB");
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      onFileSelect?.(file);
    };

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      setPreview(null);
      onFileSelect?.(null);
      if (internalInputRef.current) {
        internalInputRef.current.value = '';
      }
    };

    const onDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    };

    return (
      <div className="w-full">
        <label className="block text-gray-700 mb-1 text-[14px] font-medium">
          {label}
        </label>

        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition duration-150 ${isDragging ? 'border-[#4a90e2] bg-blue-50' : 'border-gray-300'
            } ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-[#4a90e2]'}`}
          onClick={() => internalInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <div className="flex flex-col items-center justify-center">
            {isUploading ? (
              <ImSpinner2 size={24} className="text-[#4a90e2] animate-spin" />
            ) : (
              <RxUpload size={24} className={`${isDragging ? 'text-[#4a90e2]' : 'text-gray-600'}`} />
            )}
            <p className="text-gray-700 mt-2">
              {isUploading ? 'Uploading Image...' : isDragging ? 'Drop image here' : 'Select Product Image'}
            </p>
            <p className="text-gray-700 mt-2 text-xs">Recommended: square JPG, PNG (max 4MB)</p>

            {preview && !isUploading && (
              <div className="mt-3 relative inline-block group">
                <img
                  src={preview}
                  alt="preview"
                  className="mx-auto w-32 h-32 object-cover rounded-md border shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors z-10"
                  title="Remove image"
                >
                  <RxCross2 size={16} />
                </button>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-medium">Change image</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <input
          type="file"
          accept="image/*"
          ref={internalInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
    );
  }
);

ImageUpload.displayName = 'ImageUpload';

export default ImageUpload;

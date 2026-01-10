'use client';

import React, { forwardRef, useState } from 'react';
import { RxUpload } from 'react-icons/rx';

interface ImageUploadProps {
  label?: string;
  initialImage?: string | null;
  onFileSelect?: (file: File) => void;
}

const ImageUpload = forwardRef<HTMLInputElement, ImageUploadProps>(
  ({ label = 'Upload Image', initialImage = null, onFileSelect }, ref) => {
    const [preview, setPreview] = useState<string | null>(initialImage);
    const [fileName, setFileName] = useState<string | null>(
      initialImage ? initialImage : null
    );

    return (
      <div>
        <label className="block text-gray-700 mb-1 text-[14px] font-medium">
          {label}
        </label>

        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#4a90e2] transition duration-150"
          onClick={() => (ref as React.RefObject<HTMLInputElement>)?.current?.click()}
        >
          <div className="flex flex-col items-center justify-center">
            <RxUpload size={24} className="text-gray-600" />
            <p className="text-gray-700 mt-2">Upload image</p>
            <p className="text-gray-700 mt-2 text-xs">Maximum size 10 MB, JPG, PNG, JPEG</p>

            {fileName && (
              <p className="mt-2 text-[#4a90e2] text-sm font-semibold">
                Selected: {fileName}
              </p>
            )}

            {preview && (
              <img
                src={preview}
                alt="preview"
                className="mt-3 mx-auto w-28 h-28 object-cover rounded-md border"
              />
            )}
          </div>
        </div>

        <input
          type="file"
          accept="image/*"
          ref={ref}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setFileName(file.name);
            setPreview(URL.createObjectURL(file));
            onFileSelect?.(file);
          }}
        />
      </div>
    );
  }
);

ImageUpload.displayName = 'ImageUpload';

export default ImageUpload;

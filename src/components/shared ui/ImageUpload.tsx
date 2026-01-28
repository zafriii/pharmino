'use client';

import React, { forwardRef, useState, useRef, useImperativeHandle } from 'react';
import { RxUpload } from 'react-icons/rx';
import { useUploadThing } from '@/lib/uploadthing';
import { ImSpinner2 } from 'react-icons/im';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  label?: string;
  initialImage?: string | null;
  onUploadComplete?: (url: string) => void;
}

const ImageUpload = forwardRef<HTMLInputElement, ImageUploadProps>(
  ({ label = 'Upload Image', initialImage = null, onUploadComplete }, ref) => {
    const [preview, setPreview] = useState<string | null>(initialImage);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Internal ref for the hidden file input
    const internalInputRef = useRef<HTMLInputElement>(null);

    // Sync external ref if provided
    useImperativeHandle(ref, () => internalInputRef.current!);

    const { startUpload } = useUploadThing("imageUploader", {
      onClientUploadComplete: (res) => {
        setIsUploading(false);
        if (res && res[0]) {
          const url = res[0].url;
          setPreview(url);
          onUploadComplete?.(url);
          toast.success("Image uploaded successfully");
        }
      },
      onUploadError: (error: Error) => {
        setIsUploading(false);
        toast.error(`Upload failed: ${error.message}`);
      },
      onUploadBegin: () => {
        setIsUploading(true);
      },
    });

    const handleFile = async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        toast.error("File size must be less than 4MB");
        return;
      }
      await startUpload([file]);
    };

    const onDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) await handleFile(file);
    };

    return (
      <div>
        <label className="block text-gray-700 mb-1 text-[14px] font-medium">
          {label}
        </label>

        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition duration-150 ${isDragging ? 'border-[#4a90e2] bg-blue-50' : 'border-gray-300'
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
              {isUploading ? 'Uploading...' : isDragging ? 'Drop image here' : 'Upload image'}
            </p>
            <p className="text-gray-700 mt-2 text-xs">Maximum size 4 MB, JPG, PNG, JPEG</p>

            {preview && !isUploading && (
              <div className="mt-3 relative group">
                <img
                  src={preview}
                  alt="preview"
                  className="mx-auto w-28 h-28 object-cover rounded-md border"
                />
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
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await handleFile(file);
          }}
        />
      </div>
    );
  }
);

ImageUpload.displayName = 'ImageUpload';

export default ImageUpload;


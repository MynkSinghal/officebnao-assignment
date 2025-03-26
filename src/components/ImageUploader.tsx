
import React, { useState, useRef, useCallback } from 'react';
import { Upload, ImagePlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ImageUploaderProps {
  onUpload: (files: File[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files).filter(file => 
          file.type.startsWith('image/')
        );
        
        if (files.length === 0) {
          toast.error('Please upload image files only (.jpg, .png, .gif)');
          return;
        }
        
        processFiles(files);
      }
    },
    [onUpload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        processFiles(files);
        // Reset the input value so the same file can be uploaded again
        e.target.value = '';
      }
    },
    [onUpload]
  );

  const processFiles = async (files: File[]) => {
    try {
      setIsUploading(true);
      await onUpload(files);
    } catch (error) {
      console.error("Error processing files:", error);
      toast.error("Failed to process image files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleBrowseClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  return (
    <div 
      className={cn(
        "upload-zone h-64 flex flex-col items-center justify-center p-6 text-center",
        isDragging && "active",
        isUploading && "pointer-events-none opacity-70"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />
      
      <div className="animate-float">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
          <ImagePlus className="h-8 w-8 text-primary" />
        </div>
      </div>
      
      <h3 className="text-lg font-medium mb-2">
        {isDragging ? "Drop your images here" : "Drag & drop your images here"}
      </h3>
      
      <p className="text-muted-foreground mb-4 max-w-md">
        Supported formats: JPEG, PNG, GIF, WebP, SVG
      </p>
      
      <Button 
        onClick={handleBrowseClick}
        disabled={isUploading}
        className="group relative overflow-hidden"
      >
        <span className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          {isUploading ? "Uploading..." : "Browse Files"}
        </span>
      </Button>
    </div>
  );
};

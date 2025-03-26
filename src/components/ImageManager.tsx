import React, { useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { ImageEditor } from './ImageEditor';
import { ImageGallery } from './ImageGallery';
import { toast } from 'sonner';

export interface ImageAsset {
  id: string;
  file: File;
  url: string;
  originalUrl: string; // Keep original for reset purposes
  width?: number;
  height?: number;
  createdAt: Date;
}

export const ImageManager: React.FC = () => {
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [editingImage, setEditingImage] = useState<ImageAsset | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleUpload = async (files: File[]) => {
    try {
      const newImages: ImageAsset[] = await Promise.all(
        files.map(async (file) => {
          const url = URL.createObjectURL(file);
          return {
            id: crypto.randomUUID(),
            file,
            url,
            originalUrl: url,
            createdAt: new Date(),
          };
        })
      );

      setImages((prev) => [...prev, ...newImages]);
      
      if (newImages.length === 1) {
        // Open editor automatically when uploading a single image
        setEditingImage(newImages[0]);
        setIsDrawerOpen(true);
      }
      
      toast.success(
        newImages.length === 1
          ? 'Image uploaded successfully'
          : `${newImages.length} images uploaded successfully`
      );
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    }
  };

  const handleUpdateImage = (updatedImage: ImageAsset) => {
    setImages((prev) =>
      prev.map((img) => (img.id === updatedImage.id ? updatedImage : img))
    );
    setEditingImage(updatedImage);
  };

  const handleDeleteImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (editingImage?.id === id) {
      setEditingImage(null);
      setIsDrawerOpen(false);
    }
    toast.success('Image deleted successfully');
  };

  const handleEditImage = (image: ImageAsset) => {
    setEditingImage(image);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    // Keep the editing image for a moment to prevent flickering
    setTimeout(() => setEditingImage(null), 300);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-8 animate-fade-in opacity-0" style={{ animationDelay: '0.1s' }}>
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-medium tracking-tight">Image Asset Manager</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload, edit, and manage your image assets in one place. Drag and drop images or click to browse your files.
          </p>
        </header>

        <ImageUploader onUpload={handleUpload} />

        <ImageGallery 
          images={images} 
          onEdit={handleEditImage} 
          onDelete={handleDeleteImage} 
        />

        <ImageEditor 
          image={editingImage} 
          isOpen={isDrawerOpen} 
          onClose={handleCloseDrawer}
          onUpdate={handleUpdateImage}
          onDelete={handleDeleteImage}
        />
      </div>
    </div>
  );
};

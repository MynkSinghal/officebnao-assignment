import React, { useState, useEffect, useRef } from 'react';
import { ImageAsset } from './ImageManager';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: ImageAsset[];
  onEdit: (image: ImageAsset) => void;
  onDelete: (id: string) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ 
  images, 
  onEdit, 
  onDelete 
}) => {
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [imageHeights, setImageHeights] = useState<Record<string, number>>({});
  const [columns, setColumns] = useState(getColumnCount());
  const galleryRef = useRef<HTMLDivElement>(null);

  // Handle image load and store dimensions
  const handleImageLoad = (id: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setLoadedImages(prev => ({ ...prev, [id]: true }));
    setImageHeights(prev => ({ ...prev, [id]: img.height }));
  };

  // Determine column count based on screen width
  function getColumnCount() {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 768) return 2;
    if (window.innerWidth < 1024) return 3;
    return 4;
  }

  // Update columns when window is resized
  useEffect(() => {
    const handleResize = () => {
      setColumns(getColumnCount());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Organize images into masonry columns
  const getImageColumns = () => {
    const cols: ImageAsset[][] = Array.from({ length: columns }, () => []);
    const colHeights: number[] = Array(columns).fill(0);
    
    // Sort images by creation date (newest first)
    const sortedImages = [...images].sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
    
    // Distribute images into columns based on column height
    sortedImages.forEach((image) => {
      // Find column with the least height
      const shortestColIndex = colHeights.indexOf(Math.min(...colHeights));
      cols[shortestColIndex].push(image);
      
      // Update column height
      const imageHeight = imageHeights[image.id] || 200; // Default height if not loaded
      colHeights[shortestColIndex] += imageHeight;
    });
    
    return cols;
  };

  const imageColumns = getImageColumns();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium">Your Images</h2>
      
      {images.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No images in your collection yet. Upload some images to get started.
        </p>
      ) : (
        <div 
          ref={galleryRef}
          className="flex gap-4"
        >
          {imageColumns.map((column, colIndex) => (
            <div key={`col-${colIndex}`} className="flex-1 flex flex-col gap-4">
              {column.map((image, index) => (
                <div 
                  key={image.id}
                  className={cn(
                    "relative group rounded-lg overflow-hidden bg-muted/30 animate-fade-in opacity-0",
                    !loadedImages[image.id] && "min-h-[200px]"
                  )}
                  style={{ 
                    animationDelay: `${0.1 + index * 0.05}s`,
                  }}
                >
                  <img
                    src={image.url}
                    alt={`Image ${index + 1}`}
                    className={cn(
                      "w-full h-auto transition-opacity duration-500 aspect-auto",
                      loadedImages[image.id] ? "opacity-100" : "opacity-0"
                    )}
                    onLoad={(e) => handleImageLoad(image.id, e)}
                  />
                  
                  {!loadedImages[image.id] && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="flex gap-3">
                      <button 
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-colors"
                        onClick={() => onEdit(image)}
                        aria-label="Edit image"
                      >
                        <Pencil className="h-5 w-5 text-white" />
                      </button>
                      <button 
                        className="bg-white/20 hover:bg-destructive/80 backdrop-blur-sm rounded-full p-3 transition-colors"
                        onClick={() => onDelete(image.id)}
                        aria-label="Delete image"
                      >
                        <Trash2 className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      
      {images.length > 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          {images.length} {images.length === 1 ? 'image' : 'images'} in your collection
        </p>
      )}
    </div>
  );
};

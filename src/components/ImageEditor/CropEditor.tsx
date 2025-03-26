import React, { useState, useRef, useEffect } from 'react';

interface CropEditorProps {
  previewUrl: string;
  cropBoxPos: { x: number; y: number };
  setCropBoxPos: (pos: { x: number; y: number }) => void;
  cropBoxSize: { width: number; height: number };
  setCropBoxSize: (size: { width: number; height: number }) => void;
  cropperSize: { width: number; height: number };
  setCropperSize: (size: { width: number; height: number }) => void;
  setCropRect: (rect: { x: number; y: number; width: number; height: number }) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onPreviewUpdate: () => void;
}

export const CropEditor: React.FC<CropEditorProps> = ({
  previewUrl,
  cropBoxPos,
  setCropBoxPos,
  cropBoxSize,
  setCropBoxSize,
  cropperSize,
  setCropperSize,
  setCropRect,
  canvasRef,
  onPreviewUpdate
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0 });
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  
  const cropperRef = useRef<HTMLDivElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);
  
  // Initial load and resize handler
  useEffect(() => {
    if (!cropperRef.current) return;

    const updateCropperSize = () => {
      if (!cropperRef.current || !imageRef.current) return;
      
      const container = cropperRef.current;
      const rect = container.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      
      setCropperSize({ width: containerWidth, height: containerHeight });
    };

    updateCropperSize();
    
    window.addEventListener('resize', updateCropperSize);
    return () => {
      window.removeEventListener('resize', updateCropperSize);
    };
  }, [setCropperSize]);

  // Image load handler
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      if (!cropperRef.current) return;
      
      const { naturalWidth, naturalHeight } = img;
      setImageSize({ width: naturalWidth, height: naturalHeight });
      setImageLoaded(true);
      
      // Calculate display size (maintaining aspect ratio)
      const containerRect = cropperRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      const imageRatio = naturalWidth / naturalHeight;
      const containerRatio = containerWidth / containerHeight;
      
      let displayWidth, displayHeight;
      
      if (imageRatio > containerRatio) {
        // Image is wider than container (relative to height)
        displayWidth = containerWidth;
        displayHeight = containerWidth / imageRatio;
      } else {
        // Image is taller than container (relative to width)
        displayHeight = containerHeight;
        displayWidth = containerHeight * imageRatio;
      }
      
      // Calculate position to center the image
      const offsetX = (containerWidth - displayWidth) / 2;
      const offsetY = (containerHeight - displayHeight) / 2;
      
      setImageDisplaySize({ width: displayWidth, height: displayHeight });
      setImageOffset({ x: offsetX, y: offsetY });
      
      // Set initial crop box if not already set
      if (cropBoxSize.width === 0 || cropBoxSize.height === 0) {
        const initialCropSize = Math.min(displayWidth, displayHeight) * 0.8;
        const cropX = offsetX + (displayWidth - initialCropSize) / 2;
        const cropY = offsetY + (displayHeight - initialCropSize) / 2;
        
        setCropBoxPos({ x: cropX, y: cropY });
        setCropBoxSize({ width: initialCropSize, height: initialCropSize });
      }
    };
    img.src = previewUrl;
  }, [previewUrl, cropBoxSize.width, cropBoxSize.height, setCropBoxPos, setCropBoxSize, cropperSize]);

  // Update crop rectangle whenever the crop box changes
  useEffect(() => {
    if (!imageLoaded || imageSize.width === 0 || imageSize.height === 0) return;
    
    // Calculate the actual image coordinates based on the crop box position in the UI
    const scaleX = imageSize.width / imageDisplaySize.width;
    const scaleY = imageSize.height / imageDisplaySize.height;
    
    // Convert from screen coordinates to image coordinates
    const relativeX = cropBoxPos.x - imageOffset.x;
    const relativeY = cropBoxPos.y - imageOffset.y;
    
    const imageX = Math.max(0, relativeX * scaleX);
    const imageY = Math.max(0, relativeY * scaleY);
    const imageWidth = Math.min(imageSize.width - imageX, cropBoxSize.width * scaleX);
    const imageHeight = Math.min(imageSize.height - imageY, cropBoxSize.height * scaleY);
    
    setCropRect({
      x: Math.round(imageX),
      y: Math.round(imageY),
      width: Math.round(imageWidth),
      height: Math.round(imageHeight)
    });
    
    // Trigger a preview update
    onPreviewUpdate();
  }, [
    cropBoxPos, 
    cropBoxSize, 
    imageLoaded, 
    imageSize, 
    imageDisplaySize, 
    imageOffset, 
    setCropRect,
    onPreviewUpdate
  ]);

  const handleMouseDown = (e: React.MouseEvent, type?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    
    if (type) {
      setResizing(type);
    } else {
      setResizing(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !cropperRef.current) return;
    
    const deltaX = e.clientX - dragStartPos.x;
    const deltaY = e.clientY - dragStartPos.y;
    
    if (resizing) {
      let newWidth = cropBoxSize.width;
      let newHeight = cropBoxSize.height;
      let newX = cropBoxPos.x;
      let newY = cropBoxPos.y;
      
      // Handle different resize operations
      switch (resizing) {
        case 'top-left':
          newWidth = Math.max(50, cropBoxSize.width - deltaX);
          newHeight = Math.max(50, cropBoxSize.height - deltaY);
          newX = cropBoxPos.x + (cropBoxSize.width - newWidth);
          newY = cropBoxPos.y + (cropBoxSize.height - newHeight);
          break;
        case 'top-right':
          newWidth = Math.max(50, cropBoxSize.width + deltaX);
          newHeight = Math.max(50, cropBoxSize.height - deltaY);
          newY = cropBoxPos.y + (cropBoxSize.height - newHeight);
          break;
        case 'bottom-left':
          newWidth = Math.max(50, cropBoxSize.width - deltaX);
          newHeight = Math.max(50, cropBoxSize.height + deltaY);
          newX = cropBoxPos.x + (cropBoxSize.width - newWidth);
          break;
        case 'bottom-right':
          newWidth = Math.max(50, cropBoxSize.width + deltaX);
          newHeight = Math.max(50, cropBoxSize.height + deltaY);
          break;
      }
      
      // Ensure the crop box stays within the image boundaries
      const minX = imageOffset.x;
      const minY = imageOffset.y;
      const maxX = imageOffset.x + imageDisplaySize.width;
      const maxY = imageOffset.y + imageDisplaySize.height;
      
      newX = Math.max(minX, Math.min(newX, maxX - 50));
      newY = Math.max(minY, Math.min(newY, maxY - 50));
      
      // Make sure width/height don't exceed image boundaries
      if (newX + newWidth > maxX) newWidth = maxX - newX;
      if (newY + newHeight > maxY) newHeight = maxY - newY;
      
      // Update crop box
      setCropBoxSize({ width: newWidth, height: newHeight });
      setCropBoxPos({ x: newX, y: newY });
    } else {
      // Move the entire crop box
      let newX = cropBoxPos.x + deltaX;
      let newY = cropBoxPos.y + deltaY;
      
      // Keep within image boundaries
      const minX = imageOffset.x;
      const minY = imageOffset.y;
      const maxX = imageOffset.x + imageDisplaySize.width - cropBoxSize.width;
      const maxY = imageOffset.y + imageDisplaySize.height - cropBoxSize.height;
      
      newX = Math.max(minX, Math.min(newX, maxX));
      newY = Math.max(minY, Math.min(newY, maxY));
      
      setCropBoxPos({ x: newX, y: newY });
    }
    
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setResizing(null);
  };

  return (
    <div 
      ref={cropperRef}
      className="relative w-full h-full min-h-[300px] select-none bg-black/10 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ touchAction: 'none' }}
    >
      {/* Background image */}
      <img
        ref={imageRef}
        src={previewUrl}
        alt="Background"
        className="absolute pointer-events-none object-contain"
        style={{
          left: `${imageOffset.x}px`,
          top: `${imageOffset.y}px`,
          width: `${imageDisplaySize.width}px`,
          height: `${imageDisplaySize.height}px`
        }}
      />
      
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />
      
      {/* Crop box */}
      <div 
        ref={cropAreaRef}
        className="absolute border-2 border-primary cursor-move z-10"
        style={{
          left: `${cropBoxPos.x}px`,
          top: `${cropBoxPos.y}px`,
          width: `${cropBoxSize.width}px`,
          height: `${cropBoxSize.height}px`,
        }}
        onMouseDown={(e) => handleMouseDown(e)}
      >
        {/* The cropped image preview */}
        <div className="absolute inset-0 overflow-hidden">
          <img 
            ref={previewImageRef}
            src={previewUrl} 
            alt="Preview" 
            className="absolute pointer-events-none"
            style={{
              left: `${imageOffset.x - cropBoxPos.x}px`,
              top: `${imageOffset.y - cropBoxPos.y}px`,
              width: `${imageDisplaySize.width}px`,
              height: `${imageDisplaySize.height}px`
            }}
          />
        </div>
        
        {/* Resize handles */}
        <div 
          className="absolute w-4 h-4 bg-primary rounded-full cursor-nwse-resize -left-2 -top-2 z-20"
          onMouseDown={(e) => handleMouseDown(e, 'top-left')}
        />
        <div 
          className="absolute w-4 h-4 bg-primary rounded-full cursor-nesw-resize -right-2 -top-2 z-20"
          onMouseDown={(e) => handleMouseDown(e, 'top-right')}
        />
        <div 
          className="absolute w-4 h-4 bg-primary rounded-full cursor-nesw-resize -left-2 -bottom-2 z-20"
          onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
        />
        <div 
          className="absolute w-4 h-4 bg-primary rounded-full cursor-nwse-resize -right-2 -bottom-2 z-20"
          onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
        />
      </div>
    </div>
  );
};

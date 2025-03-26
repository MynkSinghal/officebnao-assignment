import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ImageAsset } from '../ImageManager';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { EditControls } from './EditControls';
import { CropEditor } from './CropEditor';
import { useImageEditor } from './hooks/useImageEditor';

interface ImageEditorProps {
  image: ImageAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedImage: ImageAsset) => void;
  onDelete: (id: string) => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
  image,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const {
    editMode,
    setEditMode,
    rotation,
    setRotation,
    flipH,
    setFlipH,
    flipV,
    setFlipV,
    isProcessing,
    setIsProcessing,
    cropRect,
    setCropRect,
    previewUrl,
    setPreviewUrl,
    cropBoxPos,
    setCropBoxPos,
    cropBoxSize,
    setCropBoxSize,
    cropperSize,
    setCropperSize,
    handleSaveChanges,
    handleRotate,
    handleRotateCounterClockwise,
    handleFlipHorizontal,
    handleFlipVertical,
    handleReset,
    handleDelete,
    handleToggleCropMode,
    applyTransforms,
    updatePreview
  } = useImageEditor({ image, onUpdate, onDelete });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize when image changes
  useEffect(() => {
    if (image) {
      // Reset all transformations
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setEditMode(null);
      
      // Set initial preview URL to the image URL
      setPreviewUrl(image.url);
    } else {
      setPreviewUrl(null);
    }
  }, [image, setRotation, setFlipH, setFlipV, setEditMode, setPreviewUrl]);
  
  // Apply transformations whenever relevant properties change
  useEffect(() => {
    if (isOpen && image && canvasRef.current && imageRef.current) {
      // Wait for image to be loaded before applying transformations
      if (imageRef.current.complete) {
        applyTransforms(canvasRef, imageRef);
      } else {
        imageRef.current.onload = () => applyTransforms(canvasRef, imageRef);
      }
    }
  }, [isOpen, image, rotation, flipH, flipV, editMode, cropRect, applyTransforms]);

  // Handle preview update
  const handlePreviewUpdate = () => {
    if (canvasRef.current && imageRef.current) {
      updatePreview(canvasRef, imageRef);
    }
  };

  // Handle file replacement
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!image || !e.target.files || e.target.files.length === 0) return;
    
    try {
      setIsProcessing(true);
      
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      
      const updatedImage: ImageAsset = {
        ...image,
        file,
        url,
        originalUrl: url,
      };
      
      onUpdate(updatedImage);
      toast.success('Image replaced successfully');
      
      // Reset the file input value
      if (e.target) {
        e.target.value = '';
      }
    } catch (error) {
      console.error('Error replacing image:', error);
      toast.error('Failed to replace image');
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger file input click when Replace button is clicked
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (!image) return null;

  return (
    <>
      {/* Hidden original image for processing */}
      <img
        ref={imageRef}
        src={image.url}
        alt="Original"
        className="hidden"
        crossOrigin="anonymous"
      />
      
      {/* Hidden canvas for image processing */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
      
      {/* Hidden file input for image replacement */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent 
          side="right" 
          className="sm:max-w-lg w-full p-0 overflow-hidden"
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="px-6 pt-6 pb-4">
              <SheetTitle className="text-xl font-medium text-center">
                Edit Image
              </SheetTitle>
            </SheetHeader>
            
            <Separator />
            
            <div className="flex-1 overflow-auto p-6">
              <div 
                className="relative bg-black/5 rounded-lg overflow-hidden flex items-center justify-center mb-6" 
                style={{ minHeight: '240px' }}
              >
                {previewUrl ? (
                  editMode === 'crop' ? (
                    <CropEditor 
                      previewUrl={previewUrl} 
                      cropBoxPos={cropBoxPos}
                      setCropBoxPos={setCropBoxPos}
                      cropBoxSize={cropBoxSize}
                      setCropBoxSize={setCropBoxSize}
                      cropperSize={cropperSize}
                      setCropperSize={setCropperSize}
                      setCropRect={setCropRect}
                      canvasRef={canvasRef}
                      onPreviewUpdate={handlePreviewUpdate}
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className={`max-w-full max-h-[400px] object-contain animate-in fade-in duration-300 ${isProcessing ? 'opacity-50' : ''}`}
                    />
                  )
                ) : (
                  <div className="flex items-center justify-center h-full w-full p-8">
                    <div className="animate-pulse h-32 w-32 rounded-full bg-muted" />
                  </div>
                )}
                
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                    <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  </div>
                )}
              </div>
              
              <EditControls 
                rotation={rotation}
                setRotation={setRotation}
                flipH={flipH}
                flipV={flipV}
                editMode={editMode}
                onRotate={handleRotate}
                onRotateCounterClockwise={handleRotateCounterClockwise}
                onFlipHorizontal={handleFlipHorizontal}
                onFlipVertical={handleFlipVertical}
                onToggleCropMode={handleToggleCropMode}
                onReplace={triggerFileInput}
                onReset={handleReset}
              />
            </div>
            
            <div className="p-4 border-t bg-muted/50">
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  className="flex-1"
                  onClick={onClose}
                >
                  <X className="h-4 w-4 mr-2" />
                  <span>Cancel</span>
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={handleDelete}
                >
                  <span>Delete</span>
                </Button>
                <Button 
                  variant="default" 
                  className="flex-1"
                  onClick={() => handleSaveChanges(canvasRef)}
                  disabled={isProcessing}
                >
                  <Save className="h-4 w-4 mr-2" />
                  <span>Save</span>
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

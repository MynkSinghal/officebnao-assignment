import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { ImageAsset } from '../../ImageManager';

interface UseImageEditorProps {
  image: ImageAsset | null;
  onUpdate: (updatedImage: ImageAsset) => void;
  onDelete: (id: string) => void;
}

export const useImageEditor = ({ image, onUpdate, onDelete }: UseImageEditorProps) => {
  const [editMode, setEditMode] = useState<'crop' | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropBoxPos, setCropBoxPos] = useState({ x: 0, y: 0 });
  const [cropBoxSize, setCropBoxSize] = useState({ width: 0, height: 0 });
  const [cropperSize, setCropperSize] = useState({ width: 0, height: 0 });

  // Function to apply all transformations and update the preview
  const applyTransforms = useCallback((canvasRef: React.RefObject<HTMLCanvasElement>, imageRef: React.RefObject<HTMLImageElement>) => {
    if (!canvasRef.current || !imageRef.current || !image) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the source image
    const img = imageRef.current;
    
    // First apply rotation and flips to a temporary canvas
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // Set dimensions based on rotation
    const { naturalWidth, naturalHeight } = img;
    let canvasWidth = naturalWidth;
    let canvasHeight = naturalHeight;
    
    if (rotation % 180 !== 0) {
      // For 90° and 270° rotations, swap width and height
      canvasWidth = naturalHeight;
      canvasHeight = naturalWidth;
    }
    
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;
    
    // Clear and apply transformations
    tempCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    tempCtx.save();
    
    // Move to center, rotate, scale, draw, then restore
    tempCtx.translate(canvasWidth / 2, canvasHeight / 2);
    tempCtx.rotate((rotation * Math.PI) / 180);
    tempCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    tempCtx.drawImage(img, -naturalWidth / 2, -naturalHeight / 2, naturalWidth, naturalHeight);
    tempCtx.restore();
    
    // Now apply cropping if needed
    if (editMode === 'crop' && cropRect.width > 0 && cropRect.height > 0) {
      // Make sure crop rect is valid for the transformed image
      const validX = Math.max(0, Math.min(cropRect.x, canvasWidth));
      const validY = Math.max(0, Math.min(cropRect.y, canvasHeight));
      const validWidth = Math.max(1, Math.min(cropRect.width, canvasWidth - validX));
      const validHeight = Math.max(1, Math.min(cropRect.height, canvasHeight - validY));
      
      // Set the main canvas to the cropped size
      canvas.width = validWidth;
      canvas.height = validHeight;
      
      // Draw only the cropped portion to the main canvas
      ctx.drawImage(
        tempCanvas,
        validX, validY, validWidth, validHeight, // Source rectangle
        0, 0, validWidth, validHeight            // Destination rectangle
      );
    } else {
      // If not cropping, just copy the entire transformed image
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      ctx.drawImage(tempCanvas, 0, 0);
    }
    
    // Update preview URL
    try {
      const dataUrl = canvas.toDataURL(image.file?.type || 'image/jpeg');
      setPreviewUrl(dataUrl);
    } catch (error) {
      console.error('Error creating preview:', error);
      toast.error('Error creating image preview');
    }
  }, [rotation, flipH, flipV, editMode, cropRect, image]);

  // Update the preview immediately when changes are made
  const updatePreview = useCallback((canvasRef: React.RefObject<HTMLCanvasElement>, imageRef: React.RefObject<HTMLImageElement>) => {
    if (canvasRef.current && imageRef.current && image) {
      applyTransforms(canvasRef, imageRef);
    }
  }, [image, applyTransforms]);

  // Save the edited image
  const handleSaveChanges = useCallback(async (canvasRef: React.RefObject<HTMLCanvasElement>) => {
    if (!canvasRef.current || !image) return;
    
    try {
      setIsProcessing(true);
      
      const canvas = canvasRef.current;
      const fileType = image.file?.type || 'image/jpeg';
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create image blob'));
          },
          fileType,
          0.95 // Quality
        );
      });
      
      // Create file and URL objects
      const filename = image.file?.name || `image-${Date.now()}.jpg`;
      const newFile = new File([blob], filename, { type: fileType });
      const newUrl = URL.createObjectURL(blob);
      
      // Create updated image object
      const updatedImage: ImageAsset = {
        ...image,
        file: newFile,
        url: newUrl,
        width: canvas.width,
        height: canvas.height,
      };
      
      // Reset edit state
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setEditMode(null);
      
      // Update the image in parent component
      onUpdate(updatedImage);
      toast.success('Image updated successfully');
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error('Failed to save image changes');
    } finally {
      setIsProcessing(false);
    }
  }, [image, onUpdate]);

  // Handle rotation
  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleRotateCounterClockwise = useCallback(() => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  }, []);

  // Handle flips
  const handleFlipHorizontal = useCallback(() => {
    setFlipH((prev) => !prev);
  }, []);

  const handleFlipVertical = useCallback(() => {
    setFlipV((prev) => !prev);
  }, []);

  // Handle reset
  const handleReset = useCallback(() => {
    if (!image) return;
    
    // Reset to original
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setEditMode(null);
    setPreviewUrl(image.originalUrl || image.url);
    
    const updatedImage: ImageAsset = {
      ...image,
      url: image.originalUrl || image.url,
    };
    
    onUpdate(updatedImage);
    toast.success('Image reset to original');
  }, [image, onUpdate]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (!image) return;
    onDelete(image.id);
  }, [image, onDelete]);

  // Toggle crop mode
  const handleToggleCropMode = useCallback(() => {
    setEditMode((prev) => (prev === 'crop' ? null : 'crop'));
    
    // Reset crop box when exiting crop mode
    if (editMode === 'crop') {
      // Clear crop values
      setCropRect({ x: 0, y: 0, width: 0, height: 0 });
    }
  }, [editMode]);

  return {
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
  };
};


import React from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Crop, RotateCw, FlipHorizontal, FlipVertical, Upload, RotateCcw, Undo } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface EditControlsProps {
  rotation: number;
  setRotation: (rotation: number) => void;
  flipH: boolean;
  flipV: boolean;
  editMode: 'crop' | null;
  onRotate: () => void;
  onRotateCounterClockwise: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onToggleCropMode: () => void;
  onReplace: () => void;
  onReset: () => void;
}

export const EditControls: React.FC<EditControlsProps> = ({
  rotation,
  setRotation,
  flipH,
  flipV,
  editMode,
  onRotate,
  onRotateCounterClockwise,
  onFlipHorizontal,
  onFlipVertical,
  onToggleCropMode,
  onReplace,
  onReset,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Image Rotation</h3>
        <div className="flex gap-2 mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onRotateCounterClockwise}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            <span>-90°</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onRotate}
          >
            <RotateCw className="h-4 w-4 mr-2" />
            <span>+90°</span>
          </Button>
        </div>
        <div className="flex items-center gap-3 px-1">
          <span className="text-xs text-muted-foreground">0°</span>
          <Slider 
            value={[rotation]} 
            min={0} 
            max={360} 
            step={1}
            onValueChange={(value) => setRotation(value[0])}
          />
          <span className="text-xs text-muted-foreground">360°</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Flip</h3>
        <div className="flex gap-2">
          <Button 
            variant={flipH ? "default" : "outline"} 
            size="sm" 
            className="flex-1"
            onClick={onFlipHorizontal}
          >
            <FlipHorizontal className="h-4 w-4 mr-2" />
            <span>Horizontal</span>
          </Button>
          <Button 
            variant={flipV ? "default" : "outline"} 
            size="sm" 
            className="flex-1"
            onClick={onFlipVertical}
          >
            <FlipVertical className="h-4 w-4 mr-2" />
            <span>Vertical</span>
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Advanced</h3>
        <div className="flex gap-2">
          <Button 
            variant={editMode === 'crop' ? "default" : "outline"} 
            size="sm" 
            className="flex-1"
            onClick={onToggleCropMode}
          >
            <Crop className="h-4 w-4 mr-2" />
            <span>Crop</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onReplace}
          >
            <Upload className="h-4 w-4 mr-2" />
            <span>Replace</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onReset}
          >
            <Undo className="h-4 w-4 mr-2" />
            <span>Reset</span>
          </Button>
        </div>
      </div>
      
      {editMode === 'crop' && (
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground mb-2">
            Drag to position and resize the crop area. Use the corner handles to adjust the size.
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">Crop Tips</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">How to crop your image:</h4>
                <ul className="ml-4 space-y-1 text-sm list-disc">
                  <li>Drag the box to reposition the crop area</li>
                  <li>Use the corner handles to resize</li>
                  <li>Click outside the crop area when done</li>
                  <li>Press Save to apply your changes</li>
                </ul>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};

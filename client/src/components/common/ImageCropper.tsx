import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Crop, RotateCw, RotateCcw, ZoomIn, ZoomOut, Maximize, Save, X } from 'lucide-react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  aspectRatio?: number;
  onCropComplete: (croppedImageUrl: string) => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  isOpen,
  onClose,
  imageUrl,
  aspectRatio = 16 / 9,
  onCropComplete
}) => {
  const cropperRef = useRef<Cropper>(null);
  const [zoom, setZoom] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  
  const handleCrop = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    
    // Get the cropped canvas
    const croppedCanvas = cropper.getCroppedCanvas({
      minWidth: 256,
      minHeight: 256,
      maxWidth: 4096,
      maxHeight: 4096,
      fillColor: '#fff',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });
    
    // Convert canvas to blob
    croppedCanvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty or image is invalid');
        return;
      }
      
      // Create a File object from the blob
      const file = new File([blob], `cropped_image_${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      // Create a FileReader to read the file as a data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          // Pass the data URL to the parent component
          onCropComplete(e.target.result as string);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }, 'image/jpeg', 0.95);
  };
  
  const handleZoom = (value: number[]) => {
    const newZoom = value[0];
    setZoom(newZoom);
    
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      // Convert zoom scale from 0-100 to a reasonable zoom scale
      const zoomScale = 1 + (newZoom / 100);
      cropper.zoomTo(zoomScale);
    }
  };
  
  const handleRotate = (degrees: number) => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.rotate(degrees);
      setRotation((prev) => prev + degrees);
    }
  };
  
  const resetCropper = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.reset();
      setZoom(0);
      setRotation(0);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
          <DialogDescription>
            Adjust the crop area by dragging the image or using the controls below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4">
          <Cropper
            ref={cropperRef}
            src={imageUrl}
            style={{ height: 400, width: '100%' }}
            aspectRatio={aspectRatio}
            viewMode={1}
            guides={true}
            background={false}
            responsive={true}
            autoCropArea={0.8}
            checkOrientation={false}
            className="cropper"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Zoom</label>
            <div className="flex items-center gap-2">
              <ZoomOut className="h-4 w-4" />
              <Slider
                value={[zoom]}
                min={0}
                max={100}
                step={1}
                onValueChange={handleZoom}
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Rotation</label>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleRotate(-90)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <span className="mx-2 text-sm">{rotation}°</span>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleRotate(90)}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={resetCropper}
              >
                <Maximize className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleCrop} className="gap-1.5">
            <Crop className="h-4 w-4" />
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;
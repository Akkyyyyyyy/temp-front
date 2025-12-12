import { useState, useCallback } from "react";
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface ImageCropModalProps {
    isOpen: boolean;
    onClose: () => void;
    image: string | null;
    onCropComplete: (croppedImageBlob: Blob) => Promise<void>;
    aspect?: number;
    cropShape: "rect" | "round";
}

export function ImageCropModal({
    isOpen,
    onClose,
    image,
    onCropComplete,
    aspect = 1,
    cropShape
}: ImageCropModalProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [loading, setLoading] = useState(false);

    const onCropCompleteCallback = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createCroppedImage = async (): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            if (!image || !croppedAreaPixels) {
                reject(new Error('No image or crop area selected'));
                return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const imageElement = new Image();

            imageElement.src = image;
            imageElement.crossOrigin = 'anonymous';

            imageElement.onload = () => {
                canvas.width = croppedAreaPixels.width;
                canvas.height = croppedAreaPixels.height;
                

                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                // Simple draw without rotation
                ctx.drawImage(
                    imageElement,
                    croppedAreaPixels.x,
                    croppedAreaPixels.y,
                    croppedAreaPixels.width + 5,
                    croppedAreaPixels.height,
                    0,
                    0,
                    croppedAreaPixels.width,
                    croppedAreaPixels.height
                );

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas to Blob conversion failed'));
                    }
                }, 'image/jpeg', 0.9);
            };

            imageElement.onerror = () => {
                reject(new Error('Failed to load image'));
            };
        });
    };

    const handleSave = async () => {
        if (!image || !croppedAreaPixels) return;

        try {
            setLoading(true);
            const croppedBlob = await createCroppedImage();
            await onCropComplete(croppedBlob);
            handleClose();
        } catch (error) {
            console.error('Error cropping image:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Crop Profile Picture</DialogTitle>
                </DialogHeader>

                <div className="relative h-80 w-full bg-gray-100 rounded-lg">
                    {image && (
                        <Cropper
                            image={image}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropCompleteCallback}
                            cropShape={cropShape}
                            showGrid={true}
                            objectFit="contain"
                        />
                    )}
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Zoom</label>
                        <Slider
                            value={[zoom]}
                            onValueChange={(value) => setZoom(value[0])}
                            min={1}
                            max={3}
                            step={0.1}
                            className="w-full"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading || !croppedAreaPixels}>
                        {loading ? "Saving..." : "Upload image"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
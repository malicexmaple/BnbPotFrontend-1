import { useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GOLDEN, DARK_BG, BORDER_RADIUS } from "@/constants/layout";
import Cropper from "react-easy-crop";
import { ArrowLeft } from "lucide-react";

interface AvatarCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  username: string;
  onSave: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
    }, "image/jpeg");
  });
};

export default function AvatarCropModal({
  open,
  onOpenChange,
  imageUrl,
  username,
  onSave,
  onCancel,
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);

  const onCropComplete = useCallback(async (_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
    try {
      const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels);
      setCroppedPreview(croppedImage);
    } catch (e) {
      console.error(e);
    }
  }, [imageUrl]);

  const handleSave = async () => {
    if (croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels);
        onSave(croppedImage);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Get file size estimate
  const getFileSize = () => {
    if (!imageUrl) return "0 KB";
    const base64Length = imageUrl.length - (imageUrl.indexOf(',') + 1);
    const sizeInBytes = (base64Length * 3) / 4;
    const sizeInKB = sizeInBytes / 1024;
    if (sizeInKB > 1024) {
      return `${(sizeInKB / 1024).toFixed(2)} MB`;
    }
    return `${sizeInKB.toFixed(2)} KB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-0 border-0 glass-panel overflow-hidden"
        style={{
          border: GOLDEN.BORDER,
          boxShadow: '0 0 30px rgba(234, 179, 8, 0.2)',
          borderRadius: BORDER_RADIUS.STANDARD,
          background: DARK_BG.GRADIENT
        }}
      >
        <VisuallyHidden>
          <DialogTitle>Crop Avatar Image</DialogTitle>
          <DialogDescription>
            Adjust the crop area to fit your avatar perfectly.
          </DialogDescription>
        </VisuallyHidden>

        <div className="space-y-4 p-6">
          {/* Crop Area */}
          <div
            className="relative w-full bg-black rounded-lg overflow-hidden"
            style={{ height: '320px' }}
          >
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="round"
              showGrid={true}
              style={{
                containerStyle: {
                  background: '#000',
                },
                cropAreaStyle: {
                  border: '2px dashed rgba(234, 179, 8, 0.6)',
                },
              }}
            />
          </div>

          {/* File Info */}
          <div className="text-xs text-muted-foreground text-center">
            avatar_image.jpg • {getFileSize()}
          </div>

          {/* Preview Section */}
          <div className="p-4 rounded-lg" style={{
            background: 'rgba(20, 20, 20, 0.5)',
            border: '1px solid rgba(60, 60, 60, 0.3)'
          }}>
            <div className="text-sm text-muted-foreground mb-3">Preview</div>
            <div className="flex items-center gap-3">
              <div
                className="w-16 h-16 flex items-center justify-center glass-panel overflow-hidden flex-shrink-0"
                style={{
                  background: 'linear-gradient(145deg, rgba(40, 40, 40, 0.6), rgba(20, 20, 20, 0.9))',
                  border: '2px solid rgba(60, 60, 60, 0.4)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -2px 4px rgba(0, 0, 0, 0.8), 0 2px 8px rgba(0, 0, 0, 0.5)',
                  borderRadius: '50%'
                }}
              >
                {croppedPreview ? (
                  <img src={croppedPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-xs">{username.slice(0, 2).toUpperCase()}</div>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">{username}</div>
                <div className="text-xs text-muted-foreground mt-1">13:38</div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleSave}
              className="w-full font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, #EAB308, #FCD34D)',
                border: '2px solid rgba(234, 179, 8, 0.5)',
                boxShadow: '0 0 20px rgba(234, 179, 8, 0.3)'
              }}
              data-testid="button-save-avatar"
            >
              Save as Avatar
            </Button>

            <Button
              onClick={onCancel}
              variant="outline"
              className="w-full"
              style={{
                border: '1px solid rgba(60, 60, 60, 0.5)',
                background: 'rgba(20, 20, 20, 0.5)'
              }}
              data-testid="button-cancel-crop"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

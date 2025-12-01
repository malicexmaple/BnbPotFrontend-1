import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GOLDEN, DARK_BG, BORDER_RADIUS } from "@/constants/layout";
import AvatarCropModal from "./AvatarCropModal";

interface AvatarUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  avatarColor: string;
  onAvatarUpdate: (avatarUrl: string | null) => void;
  currentAvatar?: string | null;
}

export default function AvatarUploadModal({ 
  open, 
  onOpenChange, 
  username,
  avatarColor,
  onAvatarUpdate,
  currentAvatar
}: AvatarUploadModalProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageLink, setImageLink] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>("");

  const handleUploadClick = () => {
    setShowUploadDialog(true);
  };

  const handleRemove = () => {
    onAvatarUpdate(null);
    onOpenChange(false);
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setTempImageUrl(dataUrl);
      setShowUploadDialog(false);
      setShowCropDialog(true);
    };
    reader.readAsDataURL(file);
  };

  const handleLinkUpload = () => {
    if (!imageLink.trim()) return;
    
    const img = new Image();
    img.onload = () => {
      setTempImageUrl(imageLink);
      setImageLink("");
      setShowUploadDialog(false);
      setShowCropDialog(true);
    };
    img.onerror = () => {
      alert('Invalid image URL. Please check the link and try again.');
    };
    img.src = imageLink;
  };

  const handleCropSave = (croppedImageUrl: string) => {
    onAvatarUpdate(croppedImageUrl);
    setShowCropDialog(false);
    onOpenChange(false);
  };

  const handleCropCancel = () => {
    setShowCropDialog(false);
    setShowUploadDialog(true);
    setTempImageUrl("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  if (showUploadDialog) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setShowUploadDialog(false);
        }
        onOpenChange(isOpen);
      }}>
        <DialogContent 
          className="max-w-md p-6 border-0 glass-panel overflow-hidden" 
          style={{
            border: GOLDEN.BORDER,
            boxShadow: '0 0 30px rgba(234, 179, 8, 0.2)',
            borderRadius: BORDER_RADIUS.STANDARD,
            background: DARK_BG.GRADIENT
          }}
        >
          <VisuallyHidden>
            <DialogTitle>Upload Image</DialogTitle>
            <DialogDescription>
              Drag and drop an image or paste a link to upload your profile picture.
            </DialogDescription>
          </VisuallyHidden>

          <div className="space-y-6">
            {/* Drag and Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className="relative p-12 rounded-lg transition-all"
              style={{
                border: `2px dashed ${isDragging ? 'rgba(234, 179, 8, 0.6)' : 'rgba(234, 179, 8, 0.3)'}`,
                background: isDragging ? 'rgba(234, 179, 8, 0.05)' : 'transparent'
              }}
            >
              <div className="text-center space-y-4">
                <div className="text-foreground font-medium">Drag and drop an image here</div>
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  <Button 
                    type="button"
                    className="font-bold px-6 text-white"
                    style={{
                      background: 'linear-gradient(135deg, #EAB308, #FCD34D)',
                      border: '2px solid rgba(234, 179, 8, 0.5)',
                      boxShadow: '0 0 20px rgba(234, 179, 8, 0.3)'
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                    }}
                    data-testid="button-upload-file"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                </label>
                <div className="text-xs text-muted-foreground">2 MB max.</div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/20"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 text-muted-foreground" style={{ background: DARK_BG.GRADIENT }}>OR</span>
              </div>
            </div>

            {/* Paste Link */}
            <div>
              <div className="flex items-center gap-2">
                <Input
                  value={imageLink}
                  onChange={(e) => setImageLink(e.target.value)}
                  placeholder="Paste image link"
                  className="flex-1 bg-muted/30 border-border/20"
                  data-testid="input-image-link"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLinkUpload}
                  disabled={!imageLink}
                  data-testid="button-submit-link"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </Button>
              </div>
            </div>

            {/* Warning Note */}
            <div className="text-xs text-muted-foreground text-center">
              NOTE: All inappropriate images will be removed and your account{" "}
              <span className="text-foreground font-semibold">will be restricted</span> from changing avatars for a duration.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-xs p-6 border-0 glass-panel overflow-hidden" 
        style={{
          border: GOLDEN.BORDER,
          boxShadow: '0 0 30px rgba(234, 179, 8, 0.2)',
          borderRadius: BORDER_RADIUS.STANDARD,
          background: DARK_BG.GRADIENT
        }}
      >
        <VisuallyHidden>
          <DialogTitle>Change Profile Picture</DialogTitle>
          <DialogDescription>
            Upload a new profile picture or remove your current one.
          </DialogDescription>
        </VisuallyHidden>

        <div className="space-y-6">
          {/* Avatar Preview */}
          <div className="flex justify-center">
            <div
              className="w-32 h-32 flex items-center justify-center text-3xl font-bold glass-panel overflow-hidden rounded-xl"
              style={{
                background: 'linear-gradient(145deg, rgba(40, 40, 40, 0.6), rgba(20, 20, 20, 0.9))',
                border: '2px solid rgba(234, 179, 8, 0.3)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -2px 4px rgba(0, 0, 0, 0.8), 0 2px 8px rgba(0, 0, 0, 0.5)'
              }}
            >
              {currentAvatar ? (
                <img src={currentAvatar} alt={username} className="w-full h-full object-cover" />
              ) : (
                username.slice(0, 2).toUpperCase()
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleUploadClick}
              className="w-full font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, #EAB308, #FCD34D)',
                border: '2px solid rgba(234, 179, 8, 0.5)',
                boxShadow: '0 0 20px rgba(234, 179, 8, 0.3)'
              }}
              data-testid="button-upload-image"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </Button>

            <Button
              onClick={handleRemove}
              variant="outline"
              className="w-full"
              style={{
                border: '1px solid rgba(60, 60, 60, 0.5)',
                background: 'rgba(20, 20, 20, 0.5)'
              }}
              data-testid="button-remove-image"
            >
              Remove Image
            </Button>
          </div>
        </div>
      </DialogContent>

      <AvatarCropModal
        open={showCropDialog}
        onOpenChange={setShowCropDialog}
        imageUrl={tempImageUrl}
        username={username}
        onSave={handleCropSave}
        onCancel={handleCropCancel}
      />
    </Dialog>
  );
}

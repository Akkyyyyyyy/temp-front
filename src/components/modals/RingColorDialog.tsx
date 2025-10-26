import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Palette, X, Check } from "lucide-react";

const S3_URL = import.meta.env.VITE_S3_BASE_URL;

interface TeamMember {
  id: string;
  name: string;
  profilePhoto?: string;
  role: string;
  ringColor?: string;
}

interface RingColorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember | null;
  onColorChange: (memberId: string, color: string) => Promise<void>;
  isUpdating?: boolean;
}

// Color presets in hex format
const COLOR_PRESETS = [
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Green', value: '#10B981' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Red', value: '#EF4444' },
  { label: 'Orange', value: '#F97316' },
  { label: 'Teal', value: '#14B8A6' },
  { label: 'Indigo', value: '#6366F1' },
  { label: 'Pink', value: '#EC4899' },
  { label: 'Yellow', value: '#FBBF24' },
  { label: 'Lime', value: '#84CC16' },
  { label: 'Cyan', value: '#06B6D4' },
  { label: 'Amber', value: '#F59E0B' },
];

export function RingColorDialog({ 
  isOpen, 
  onClose, 
  member, 
  onColorChange, 
  isUpdating = false 
}: RingColorDialogProps) {
  const [selectedColor, setSelectedColor] = useState("#6B7280");
  const [isSaving, setIsSaving] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Reset selected color when member changes
  useEffect(() => {
    if (member?.ringColor) {
      setSelectedColor(member.ringColor);
    } else {
      setSelectedColor("#6B7280");
    }
  }, [member]);

  const handleSave = async () => {
    if (!member) return;
    
    setIsSaving(true);
    try {
      await onColorChange(member.id, selectedColor);
      onClose();
    } catch (error) {
      console.error('Failed to save ring color:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Reset to original color when closing without saving
    if (member?.ringColor) {
      setSelectedColor(member.ringColor);
    } else {
      setSelectedColor("#6B7280");
    }
    onClose();
  };

  const handleColorPreviewClick = () => {
    colorInputRef.current?.click();
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Palette className="w-5 h-5 text-primary" />
              {member.name}'s Colour
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          {/* Member Info & Preview */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/20 border">
            <Avatar 
              className="w-16 h-16 ring-4 transition-all duration-200"
              style={{ 
                borderColor: selectedColor,
                boxShadow: `0 0 0 3px ${selectedColor}`
              }}
            >
              <AvatarImage 
                src={member.profilePhoto ? `${S3_URL}/${member.profilePhoto}` : undefined} 
                alt={member.name} 
              />
              <AvatarFallback className="bg-studio-gold text-studio-dark font-semibold text-base">
                {member.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{member.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{member.role}</p>
            </div>
          </div>

          {/* Color Picker Section */}
          <div className="space-y-4">
            {/* Custom Color Picker */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Custom Color</label>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                {/* Container for positioning */}
                <div className="relative">
                  {/* Hidden but positioned color input */}
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    disabled={isUpdating || isSaving}
                    className="absolute inset-0 w-12 h-12 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    style={{ zIndex: 10 }}
                  />
                  
                  {/* Color preview that sits behind the input */}
                  <div
                    className={`
                      w-12 h-12 rounded-md border-2 transition-all duration-200
                      ${selectedColor ? 'border-border' : 'border-dashed border-muted-foreground/30'}
                    `}
                    style={{ backgroundColor: selectedColor }}
                  />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground">
                      {selectedColor}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click the color box to pick a custom color
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Color Presets */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Quick Colors</label>
              <div className="grid grid-cols-6 gap-3">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    disabled={isUpdating || isSaving}
                    className={`
                      relative w-8 h-8 rounded-lg transition-all duration-200
                      hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                      ${selectedColor === color.value 
                        ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                        : 'hover:ring-2 hover:ring-offset-2 hover:ring-border'
                      }
                    `}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  >
                    {selectedColor === color.value && (
                      <Check className="w-3 h-3 text-white absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || isUpdating}
              className="flex-1 h-11 gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Apply Color
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Loading Overlay */}
        {(isUpdating || isSaving) && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-lg border shadow-sm">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Updating...</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, X } from "lucide-react";
import { PackageType } from "@/pages/Packages";
import { PackageCard } from "@/components/PackageCard";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EditPackageDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package: PackageType;
  onSave: (pkg: PackageType) => void;
}

export function EditPackageDrawer({ open, onOpenChange, package: initialPackage, onSave }: EditPackageDrawerProps) {
  const [editedPackage, setEditedPackage] = useState<PackageType>(initialPackage);
  const [newFeature, setNewFeature] = useState("");
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState("");

  useEffect(() => {
    setEditedPackage(initialPackage);
  }, [initialPackage]);

  const handleSave = () => {
    onSave(editedPackage);
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setEditedPackage(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setEditedPackage(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleAddAddon = () => {
    if (newAddonName.trim() && newAddonPrice.trim()) {
      setEditedPackage(prev => ({
        ...prev,
        addOns: [...prev.addOns, { name: newAddonName.trim(), price: newAddonPrice.trim() }]
      }));
      setNewAddonName("");
      setNewAddonPrice("");
    }
  };

  const handleRemoveAddon = (index: number) => {
    setEditedPackage(prev => ({
      ...prev,
      addOns: prev.addOns.filter((_, i) => i !== index)
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[90vw] p-0 flex">
        {/* Form Section */}
        <div className="flex-1 border-r border-border">
          <ScrollArea className="h-screen">
            <div className="p-6 space-y-6">
              <SheetHeader>
                <SheetTitle className="text-2xl">
                  {editedPackage.name ? `Edit ${editedPackage.name}` : "Create New Package"}
                </SheetTitle>
              </SheetHeader>

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Package Name</Label>
                  <Input
                    id="name"
                    value={editedPackage.name}
                    onChange={(e) => setEditedPackage(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Premium Wedding Package"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={editedPackage.price}
                      onChange={(e) => setEditedPackage(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="2500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      value={editedPackage.duration}
                      onChange={(e) => setEditedPackage(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g., 8 hours"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <Label htmlFor="popular" className="cursor-pointer">Mark as Most Popular</Label>
                    <p className="text-sm text-muted-foreground">Highlight this package with a special badge</p>
                  </div>
                  <Switch
                    id="popular"
                    checked={editedPackage.popular}
                    onCheckedChange={(checked) => setEditedPackage(prev => ({ ...prev, popular: checked }))}
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <Label>Features</Label>
                
                {editedPackage.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={feature} disabled className="flex-1" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFeature(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a feature..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddFeature()}
                  />
                  <Button onClick={handleAddFeature} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Add-ons */}
              <div className="space-y-3">
                <Label>Add-ons</Label>
                
                {editedPackage.addOns.map((addon, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={addon.name} disabled className="flex-1" />
                    <Input value={`$${addon.price}`} disabled className="w-24" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAddon(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Input
                    value={newAddonName}
                    onChange={(e) => setNewAddonName(e.target.value)}
                    placeholder="Add-on name..."
                    className="flex-1"
                  />
                  <Input
                    value={newAddonPrice}
                    onChange={(e) => setNewAddonPrice(e.target.value)}
                    placeholder="Price"
                    type="number"
                    className="w-24"
                  />
                  <Button onClick={handleAddAddon} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button onClick={handleSave} className="flex-1">
                  Save Package
                </Button>
                <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Preview Section */}
        <div className="w-[400px] bg-muted/30 p-6">
          <div className="sticky top-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">LIVE PREVIEW</h3>
            <PackageCard
              package={editedPackage}
              onEdit={() => {}}
              onDuplicate={() => {}}
              onDelete={() => {}}
              isPreview={true}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
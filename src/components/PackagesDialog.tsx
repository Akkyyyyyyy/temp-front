import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List, X } from "lucide-react";
import { PackageCard } from "@/components/PackageCard";
import { PackageListItem } from "@/components/PackageListItem";
import { EditPackageDrawer } from "@/components/EditPackageDrawer";

interface PackagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface PackageType {
  id: string;
  name: string;
  price: string;
  duration: string;
  features: string[];
  addOns: { name: string; price: string }[];
  popular?: boolean;
}

const initialPackages: PackageType[] = [
  {
    id: "1",
    name: "Essential",
    price: "1500",
    duration: "4 hours",
    features: [
      "1 Professional Photographer",
      "Up to 100 edited photos",
      "Online gallery",
      "Basic retouching",
      "2-week delivery"
    ],
    addOns: [
      { name: "Additional photographer", price: "800" },
      { name: "Printed album", price: "400" }
    ],
    popular: false
  },
  {
    id: "2",
    name: "Premium",
    price: "2800",
    duration: "8 hours",
    features: [
      "1-2 Professional Photographers",
      "Up to 300 edited photos",
      "Online gallery with download",
      "Advanced retouching",
      "Engagement session included",
      "1-week delivery",
      "USB drive with all images"
    ],
    addOns: [
      { name: "Drone photography", price: "500" },
      { name: "Photo booth", price: "600" },
      { name: "Rush delivery (3 days)", price: "300" }
    ],
    popular: true
  },
  {
    id: "3",
    name: "Ultimate",
    price: "4500",
    duration: "Full day",
    features: [
      "2-3 Professional Photographers",
      "Unlimited edited photos",
      "Premium online gallery",
      "Advanced retouching & album design",
      "Engagement session included",
      "Second shooter included",
      "48-hour sneak peek",
      "USB + printed album",
      "Drone photography"
    ],
    addOns: [
      { name: "Video highlights reel", price: "1200" },
      { name: "Additional day coverage", price: "3000" }
    ],
    popular: false
  }
];

export function PackagesDialog({ open, onOpenChange }: PackagesDialogProps) {
  const [packages, setPackages] = useState<PackageType[]>(initialPackages);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleAddPackage = () => {
    setEditingPackage({
      id: Date.now().toString(),
      name: "",
      price: "",
      duration: "",
      features: [],
      addOns: [],
      popular: false
    });
    setIsDrawerOpen(true);
  };

  const handleEditPackage = (pkg: PackageType) => {
    setEditingPackage(pkg);
    setIsDrawerOpen(true);
  };

  const handleDuplicatePackage = (pkg: PackageType) => {
    const duplicated = {
      ...pkg,
      id: Date.now().toString(),
      name: `${pkg.name} (Copy)`,
      popular: false
    };
    setEditingPackage(duplicated);
    setIsDrawerOpen(true);
  };

  const handleSavePackage = (updatedPackage: PackageType) => {
    setPackages(prev => {
      const existingIndex = prev.findIndex(p => p.id === updatedPackage.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = updatedPackage;
        return updated;
      }
      return [...prev, updatedPackage];
    });
    setIsDrawerOpen(false);
    setEditingPackage(null);
  };

  const handleDeletePackage = (id: string) => {
    setPackages(prev => prev.filter(p => p.id !== id));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl">Package Management</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">Create and manage your photography packages</p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* View Toggle */}
                  <div className="hidden sm:flex items-center gap-1 bg-card border border-border rounded-lg p-1">
                    <Button
                      variant={viewMode === "card" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("card")}
                      className="h-8"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="h-8"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Add Package Button */}
                  <Button onClick={handleAddPackage} className="gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Package</span>
                  </Button>

                  {/* Close Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenChange(false)}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Packages Display */}
            {viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map(pkg => (
                  <PackageCard
                    key={pkg.id}
                    package={pkg}
                    onEdit={() => handleEditPackage(pkg)}
                    onDuplicate={() => handleDuplicatePackage(pkg)}
                    onDelete={() => handleDeletePackage(pkg.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {packages.map(pkg => (
                  <PackageListItem
                    key={pkg.id}
                    package={pkg}
                    onEdit={() => handleEditPackage(pkg)}
                    onDuplicate={() => handleDuplicatePackage(pkg)}
                    onDelete={() => handleDeletePackage(pkg.id)}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {packages.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No packages yet</h3>
                <p className="text-muted-foreground mb-6">Get started by creating your first package</p>
                <Button onClick={handleAddPackage}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Package
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit/Create Drawer */}
      {editingPackage && (
        <EditPackageDrawer
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          package={editingPackage}
          onSave={handleSavePackage}
        />
      )}
    </>
  );
}
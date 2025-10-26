import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List, X, Loader2 } from "lucide-react";
import { PackageCard } from "@/components/PackageCard";
import { PackageListItem } from "@/components/PackageListItem";
import { EditPackageDrawer } from "@/components/EditPackageDrawer";
import {
  createPackage,
  getAllPackages,
  updatePackage,
  deletePackage,
  type Package as ApiPackage,
  type CreatePackagePayload,
  type UpdatePackagePayload,
  getPackagesByMember
} from "@/api/package";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "./ui/skeleton";

interface PackagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId?: string; // Add memberId prop to associate packages with members
}

export interface PackageType {
  id: string;
  name: string;
  price: string;
  duration: string;
  features: string[];
  addOns: { name: string; price: string }[];
  popular?: boolean;
  status?: "active" | "inactive";
}

export function PackagesDialog({ open, onOpenChange }: PackagesDialogProps) {
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const memberId = user.data.id;

  

  // Fetch packages when dialog opens
  useEffect(() => {
    if (open) {
      fetchPackages();
    }
  }, [open]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const result = await getPackagesByMember(user.data.id);
      if (result.success && result.data) {
        // Transform API response to local PackageType
        const transformedPackages = result.data.packages.map(apiPackage => ({
          id: apiPackage.id,
          name: apiPackage.name,
          price: apiPackage.price.toString(),
          duration: apiPackage.duration,
          features: apiPackage.features ? Object.entries(apiPackage.features).map(([key, value]) =>
            `${key}: ${value}`
          ) : [],
          addOns: apiPackage.addons ? Object.entries(apiPackage.addons).map(([name, price]) => ({
            name,
            price: typeof price === 'number' ? price.toString() : String(price)
          })) : [],
          popular: apiPackage.isPopular,
          status: apiPackage.status
        }));
        setPackages(transformedPackages);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to fetch packages",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch packages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPackage = () => {
    setEditingPackage({
      id: "", // Empty ID for new packages
      name: "",
      price: "",
      duration: "",
      features: [],
      addOns: [],
      popular: false,
      status: "active"
    });
    setIsDrawerOpen(true);
  };

  const handleEditPackage = (pkg: PackageType) => {
    setEditingPackage(pkg);
    setIsDrawerOpen(true);
  };

  const handleDuplicatePackage = async (pkg: PackageType) => {
    if (!memberId) {
      toast({
        title: "Error",
        description: "Member ID is required to create packages",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const createPayload: CreatePackagePayload = {
        name: `${pkg.name} (Copy)`,
        price: parseFloat(pkg.price) || 0,
        duration: pkg.duration,
        isPopular: false, // Don't duplicate popular status
        features: pkg.features.reduce((acc, feature) => {
          const [key, value] = feature.split(': ');
          if (key && value) {
            acc[key.trim()] = isNaN(Number(value)) ? value : Number(value);
          }
          return acc;
        }, {} as Record<string, any>),
        addons: pkg.addOns.reduce((acc, addon) => {
          acc[addon.name] = parseFloat(addon.price) || 0;
          return acc;
        }, {} as Record<string, any>),
        status: "active",
        memberId: memberId
      };

      const result = await createPackage(createPayload);
      if (result.success) {
        await fetchPackages(); // Refresh the list
        toast({
          title: "Success",
          description: "Package duplicated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to duplicate package",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate package",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePackage = async (updatedPackage: PackageType) => {
    if (!memberId) {
      toast({
        title: "Error",
        description: "Member ID is required to save packages",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (updatedPackage.id) {
        // Update existing package
        const updatePayload: UpdatePackagePayload = {
          name: updatedPackage.name,
          price: parseFloat(updatedPackage.price) || 0,
          duration: updatedPackage.duration,
          isPopular: updatedPackage.popular,
          features: updatedPackage.features.reduce((acc, feature) => {
            const [key, value] = feature.split(': ');
            if (key && value) {
              acc[key.trim()] = isNaN(Number(value)) ? value : Number(value);
            }
            return acc;
          }, {} as Record<string, any>),
          addons: updatedPackage.addOns.reduce((acc, addon) => {
            acc[addon.name] = parseFloat(addon.price) || 0;
            return acc;
          }, {} as Record<string, any>),
          status: updatedPackage.status
        };

        const result = await updatePackage(updatedPackage.id, updatePayload);
        if (result.success) {
          await fetchPackages(); // Refresh the list
          toast({
            title: "Success",
            description: "Package updated successfully",
          });
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to update package",
            variant: "destructive",
          });
          return; // Don't close drawer on error
        }
      } else {
        // Create new package
        const createPayload: CreatePackagePayload = {
          name: updatedPackage.name,
          price: parseFloat(updatedPackage.price) || 0,
          duration: updatedPackage.duration,
          isPopular: updatedPackage.popular || false,
          features: updatedPackage.features.reduce((acc, feature) => {
            const [key, value] = feature.split(': ');
            if (key && value) {
              acc[key.trim()] = isNaN(Number(value)) ? value : Number(value);
            }
            return acc;
          }, {} as Record<string, any>),
          addons: updatedPackage.addOns.reduce((acc, addon) => {
            acc[addon.name] = parseFloat(addon.price) || 0;
            return acc;
          }, {} as Record<string, any>),
          status: updatedPackage.status || "active",
          memberId: memberId
        };

        const result = await createPackage(createPayload);
        if (result.success) {
          await fetchPackages(); // Refresh the list
          toast({
            title: "Success",
            description: "Package created successfully",
          });
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to create package",
            variant: "destructive",
          });
          return; // Don't close drawer on error
        }
      }

      // Only close drawer and reset state if API call was successful
      setIsDrawerOpen(false);
      setEditingPackage(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save package",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    try {
      const result = await deletePackage(id);
      if (result.success) {
        setPackages(prev => prev.filter(p => p.id !== id));
        toast({
          title: "Success",
          description: "Package deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete package",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete package",
        variant: "destructive",
      });
    }
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
                  <Button
                    onClick={handleAddPackage}
                    className="gap-2"
                    disabled={!memberId || loading}
                  >
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
  {loading ? (
    <div className="space-y-6">
      {/* Skeleton for Card View */}
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="border border-border rounded-lg p-6"
            >
              {/* Header Skeleton */}
              <div className="flex justify-center items-center mb-4">
                <div className="space-y-2 flex flex-col justify-center items-center">
                  <Skeleton className="h-10 w-56" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>

              {/* Price Skeleton */}
              <Skeleton className="h-8 w-20 mb-4" />

              {/* Features Skeleton */}
              <div className="space-y-2 mb-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    
                    <Skeleton className="h-4 w-64" />
                  </div>
                ))}
              </div>

              {/* Add-ons Skeleton */}
              <div className="space-y-2 mb-6">
                <Skeleton className="h-6 w-32 mb-2" />
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>

              {/* Button Skeleton */}
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Skeleton for List View
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Popular badge skeleton */}
                  <Skeleton className="h-6 w-16" />
                  
                  {/* Package info skeleton */}
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>

                  {/* Price skeleton */}
                  <Skeleton className="h-6 w-20" />
                </div>

                {/* Action buttons skeleton */}
                <div className="flex gap-2 ml-4">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  ) : (
    <>
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
      {packages.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No packages yet</h3>
          <p className="text-muted-foreground mb-6">Get started by creating your first package</p>
          <Button
            onClick={handleAddPackage}
            disabled={!user}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Package
          </Button>
          {!user && (
            <p className="text-sm text-destructive mt-2">
              You must be logged in to create packages
            </p>
          )}
        </div>
      )}
    </>
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
        // loading={saving}
        />
      )}
    </>
  );
}
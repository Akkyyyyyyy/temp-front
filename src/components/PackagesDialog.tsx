import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List, X, Loader2, Edit, Trash2, Pencil, Pen } from "lucide-react";
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
  getPackagesByCompany,
  setCompanyPrice,
  updateCompanyPrice,
  removeCompanyPrice
} from "@/api/package";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "./ui/skeleton";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { formatPrice, getCurrencyConfig } from "@/helper/helper";

interface PackagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId?: string;
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
  const [startingPrice, setStartingPrice] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Starting price modal state
  const [isStartingPriceModalOpen, setIsStartingPriceModalOpen] = useState(false);
  const [startingPriceInput, setStartingPriceInput] = useState("");
  const [isSavingStartingPrice, setIsSavingStartingPrice] = useState(false);
  const [isDeletingStartingPrice, setIsDeletingStartingPrice] = useState(false);

  const { user } = useAuth();
  const companyId = user?.data?.company?.id;
  const userCountry = user?.data?.company?.country;
  const currencyConfig = getCurrencyConfig(userCountry);
  const CurrencyIcon = currencyConfig.icon;

  // Fetch packages when dialog opens
  useEffect(() => {
    if (open && companyId) {
      fetchPackages();
    }
  }, [open, companyId]);

  const fetchPackages = async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const result = await getPackagesByCompany(companyId);
      if (result.success && result.data) {
        // Transform API response to local PackageType
        const transformedPackages = result.data.packages.map(apiPackage => ({
          id: apiPackage.id,
          name: apiPackage.name,
          price: apiPackage.price.toString(),
          duration: apiPackage.duration,
          features: Array.isArray(apiPackage.features) ? apiPackage.features : [],
          addOns: apiPackage.addons ? Object.entries(apiPackage.addons).map(([name, price]) => ({
            name,
            price: typeof price === 'number' ? price.toString() : String(price)
          })) : [],
          popular: apiPackage.isPopular,
          status: apiPackage.status
        }));
        setPackages(transformedPackages);
        setStartingPrice(result.data.companyPrice);
      } else {
        toast.error(result.message || "Failed to fetch packages");
      }
    } catch (error) {
      toast.error("Failed to fetch packages");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStartingPrice = async () => {
    if (!companyId) {
      toast.error("Company ID is required");
      return;
    }

    const price = parseFloat(startingPriceInput);
    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid positive number");
      return;
    }

    setIsSavingStartingPrice(true);
    try {
      const result = startingPrice === null
        ? await setCompanyPrice(companyId, price)
        : await updateCompanyPrice(companyId, price);

      if (result.success) {
        setStartingPrice(price);
        setIsStartingPriceModalOpen(false);
        setStartingPriceInput("");
        toast.success(startingPrice === null ? "Starting price set successfully" : "Starting price updated successfully");
      } else {
        toast.error(result.message || "Failed to save starting price");
      }
    } catch (error) {
      toast.error("Failed to save starting price");
    } finally {
      setIsSavingStartingPrice(false);
    }
  };

  const handleDeleteStartingPrice = async () => {
    if (!companyId) {
      toast.error("Company ID is required");
      return;
    }

    setIsDeletingStartingPrice(true);
    try {
      const result = await removeCompanyPrice(companyId);
      if (result.success) {
        setStartingPrice(null);
        toast.success("Starting price removed successfully");
      } else {
        toast.error(result.message || "Failed to remove starting price");
      }
    } catch (error) {
      toast.error("Failed to remove starting price");
    } finally {
      setIsDeletingStartingPrice(false);
    }
  };

  const handleAddPackage = () => {
    setEditingPackage({
      id: "",
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
    if (!companyId) {
      toast.error("Company ID is required to create packages");
      return;
    }

    setSaving(true);
    try {
      const createPayload: CreatePackagePayload = {
        name: `${pkg.name} (Copy)`,
        price: parseFloat(pkg.price) || 0,
        duration: pkg.duration,
        isPopular: false,
        features: pkg.features,
        addons: pkg.addOns.reduce((acc, addon) => {
          acc[addon.name] = parseFloat(addon.price) || 0;
          return acc;
        }, {} as Record<string, any>),
        status: "active",
        companyId: user.data.company.id
      };

      const result = await createPackage(createPayload);
      if (result.success) {
        await fetchPackages();
        toast.success("Package duplicated successfully");
      } else {
        toast.error(result.message || "Failed to duplicate package");
      }
    } catch (error) {
      toast.error("Failed to duplicate package");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePackage = async (updatedPackage: PackageType) => {
    if (!companyId) {
      toast.error("Company ID is required to save packages");
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
          features: updatedPackage.features,
          addons: updatedPackage.addOns.reduce((acc, addon) => {
            acc[addon.name] = parseFloat(addon.price) || 0;
            return acc;
          }, {} as Record<string, any>),
          status: updatedPackage.status
        };

        const result = await updatePackage(updatedPackage.id, updatePayload);
        if (result.success) {
          await fetchPackages();
          toast.success("Package updated successfully");
        } else {
          toast.error(result.message || "Failed to update package");
          return;
        }
      } else {
        // Create new package
        const createPayload: CreatePackagePayload = {
          name: updatedPackage.name,
          price: parseFloat(updatedPackage.price) || 0,
          duration: updatedPackage.duration,
          isPopular: updatedPackage.popular || false,
          features: updatedPackage.features,
          addons: updatedPackage.addOns.reduce((acc, addon) => {
            acc[addon.name] = parseFloat(addon.price) || 0;
            return acc;
          }, {} as Record<string, any>),
          status: updatedPackage.status || "active",
          companyId: user.data.company.id
        };

        const result = await createPackage(createPayload);
        if (result.success) {
          await fetchPackages();
          toast.success("Package created successfully");
        } else {
          toast.error(result.message || "Failed to create package");
          return;
        }
      }

      setIsDrawerOpen(false);
      setEditingPackage(null);
    } catch (error) {
      toast.error("Failed to save package");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    try {
      const result = await deletePackage(id);
      if (result.success) {
        setPackages(prev => prev.filter(p => p.id !== id));
        toast.success("Package deleted successfully");
        await fetchPackages();
      } else {
        toast.error(result.message || "Failed to delete package");
      }
    } catch (error) {
      toast.error("Failed to delete package");
    }
  };

  const hasPackages = packages.length > 0;
  const hasStartingPrice = startingPrice !== null;
  const isAdmin = user?.data?.isAdmin;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-full sm:max-w-7xl p-0 max-h-[90dvh] overflow-hidden">
          {/* Single Row Header */}
          <div className="sticky top-0 z-10 bg-background border-b border-border px-4 sm:px-6 py-4 rounded-tl-lg rounded-tr-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Left Side: Title */}
              <div>
                <DialogTitle className="text-2xl">Package Management</DialogTitle>
                {/* <p className="text-sm text-muted-foreground mt-1">
                  {hasPackages
                    ? `${packages.length} package${packages.length !== 1 ? "s" : ""} available`
                    : "Create and manage your photography packages"}
                </p> */}
              </div>

              {/* Right Side: Actions & Starting Price */}
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
                {/* View Toggle - Only show when there are packages */}
                {hasPackages && (
                  <div className="hidden sm:flex items-center gap-1 bg-card border border-border rounded-lg p-1">
                    <Button
                      variant={viewMode === "card" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("card")}
                      className="h-8"
                      title="Card View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="h-8"
                      title="List View"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {/* Starting price pill - only show when price exists */}
                {hasStartingPrice && (
                  <div className="flex items-center gap-3 px-3 sm:px-4 py-1 bg-card border border-border rounded-full">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Starting from</span>
                      <div className="flex items-center gap-1 font-semibold">
                        <CurrencyIcon className="w-3.5 h-3.5" />
                        <span>{startingPrice}</span>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-2 pl-3 border-l border-border">
                        {/* Edit Price */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          onClick={() => {
                            setStartingPriceInput(startingPrice.toString());
                            setIsStartingPriceModalOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        {/* Delete Price */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={handleDeleteStartingPrice}
                          disabled={isDeletingStartingPrice || loading}
                        >
                          {isDeletingStartingPrice ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Set Starting Price Button - shows when no price but packages exist and user is admin */}
                {!hasStartingPrice && isAdmin && hasPackages && (
                  <Button
                    onClick={() => setIsStartingPriceModalOpen(true)}
                    variant="outline"
                    className="h-10 px-3"
                  >
                    <CurrencyIcon className="w-3.5 h-3.5 mr-1.5" />
                    Set Starting Price
                  </Button>
                )}

                {/* Add Package Button - clearly separated now */}
                {isAdmin && hasPackages && (
                  <Button
                    onClick={handleAddPackage}
                    className="h-10 px-3"
                    disabled={!companyId || loading}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Package
                  </Button>
                )}
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
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 py-6 max-h-[90dvh] overflow-y-auto">
            {loading ? (
              <div className="space-y-6">
                {/* Skeleton Loading States */}
                {hasPackages ? (
                  viewMode === "card" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(3)].map((_, index) => (
                        <div
                          key={index}
                          className="border border-border rounded-lg p-6"
                        >
                          <div className="flex justify-center items-center mb-4">
                            <div className="space-y-2 flex flex-col justify-center items-center">
                              <Skeleton className="h-10 w-56" />
                              <Skeleton className="h-8 w-32" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                          </div>
                          <Skeleton className="h-8 w-20 mb-4" />
                          <div className="space-y-2 mb-6">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <Skeleton className="h-4 w-64" />
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2 mb-6">
                            <Skeleton className="h-6 w-32 mb-2" />
                            {[...Array(2)].map((_, i) => (
                              <div key={i} className="flex justify-between items-center">
                                <Skeleton className="h-4 w-20" />
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Skeleton className="h-9 flex-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, index) => (
                        <div
                          key={index}
                          className="border border-border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <Skeleton className="h-6 w-16" />
                              <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-4 w-24" />
                              </div>
                              <Skeleton className="h-6 w-20" />
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Skeleton className="h-8 w-8" />
                              <Skeleton className="h-8 w-8" />
                              <Skeleton className="h-8 w-8" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  // Empty state skeleton
                  <div className="text-center py-16">
                    <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
                    <Skeleton className="h-6 w-48 mx-auto mb-2" />
                    <Skeleton className="h-4 w-64 mx-auto mb-6" />
                    <Skeleton className="h-10 w-48 mx-auto" />
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Packages Display */}
                {hasPackages ? (
                  viewMode === "card" ? (
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
                  )
                ) : (
                  /* Empty State - No packages */
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {hasStartingPrice
                        ? "Create your first package"
                        : "Get started with packages"}
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Create packages to showcase your photography services.
                      {!hasStartingPrice
                        && " You can also set a starting price."}
                    </p>
                    {isAdmin && (
                      <div className="flex justify-center gap-3">
                        {!hasStartingPrice && (
                          <Button
                            onClick={() => setIsStartingPriceModalOpen(true)}
                            variant="outline"
                          >
                            <CurrencyIcon className="w-4 h-4 mr-2" />
                            Set Starting Price
                          </Button>
                        )}
                        <Button
                          onClick={handleAddPackage}
                          disabled={!companyId}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Package
                        </Button>
                      </div>
                    )}
                    {!companyId && (
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

      {/* Edit/Create Package Drawer */}
      {editingPackage && (
        <EditPackageDrawer
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          package={editingPackage}
          onSave={handleSavePackage}
        />
      )}

      {/* Starting Price Modal */}
      <AlertDialog open={isStartingPriceModalOpen} onOpenChange={setIsStartingPriceModalOpen}>
        <AlertDialogContent>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSaveStartingPrice();
          }}>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {hasStartingPrice ? "Edit Starting Price" : "Set Starting Price"}
              </AlertDialogTitle>

            </AlertDialogHeader>

            <div className="py-4">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <CurrencyIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input
                  id="startingPrice"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={startingPriceInput}
                  onChange={(e) => {
                    let val = e.target.value;
                    val = val.replace(/[^0-9.]/g, "");
                    const parts = val.split(".");
                    if (parts.length > 2) return;
                    if (parts[1]?.length > 2) {
                      parts[1] = parts[1].slice(0, 2);
                      val = parts.join(".");
                    }

                    setStartingPriceInput(val);
                  }}
                  className="pl-10"
                />

              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel
                type="button"
                onClick={() => {
                  setIsStartingPriceModalOpen(false);
                  setStartingPriceInput("");
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                type="submit"
                disabled={!startingPriceInput || isSavingStartingPrice}
                className="gap-2"
              >
                {isSavingStartingPrice ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : hasStartingPrice ? (
                  "Update Price"
                ) : (
                  "Set Price"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
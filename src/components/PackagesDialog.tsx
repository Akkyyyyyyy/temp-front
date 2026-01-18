import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List, X, Loader2, Edit, Trash2 } from "lucide-react";
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
  const [pricingMode, setPricingMode] = useState<"none" | "packages" | "startingPrice">("none");

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

        // Determine pricing mode based on fetched data
        if (result.data.companyPrice !== null) {
          setPricingMode("startingPrice");
        } else if (transformedPackages.length > 0) {
          setPricingMode("packages");
        } else {
          setPricingMode("none");
        }
      } else {
        toast.error(result.message || "Failed to fetch packages");
        setPricingMode("none");
      }
    } catch (error) {
      toast.error("Failed to fetch packages");
      setPricingMode("none");
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
        setPricingMode("startingPrice");
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

        // Check if we have packages to switch to, otherwise go to none
        if (packages.length > 0) {
          setPricingMode("packages");
        } else {
          setPricingMode("none");
        }

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
        console.log(result, "RESULT");

        if (result.success) {
          setPricingMode("packages");
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

          // Switch to packages mode if this is the first package
          if (pricingMode === "startingPrice" && hasStartingPrice) {
            try {
              setPricingMode("packages");
              await removeCompanyPrice(companyId);
              setStartingPrice(null);
            } catch (error) {
              console.error("Failed to delete starting price:", error);
            }
          }

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
        await fetchPackages();
        toast.success("Package deleted successfully");

        // If no packages left and we're in packages mode, switch to none
        if (packages.length === 1 && pricingMode === "packages") {
          setPricingMode("none");
        }
      } else {
        toast.error(result.message || "Failed to delete package");
      }
    } catch (error) {
      toast.error("Failed to delete package");
    }
  };

  const switchPricingMode = async () => {
    if (!companyId) return;

    // Switching FROM packages ➜ starting price
    if (pricingMode === "packages") {
      setIsStartingPriceModalOpen(true);
      return;
    }

    // Switching FROM starting price ➜ packages
    if (pricingMode === "startingPrice") {
      if (packages.length > 0) {
        setPricingMode("packages");
      } else {
        handleAddPackage();
      }
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
          <div className="sticky top-0 z-10 bg-background b px-4 sm:px-6 py-4 rounded-tl-lg rounded-tr-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Left Side: Title */}
              <div>
                <DialogTitle className="text-2xl">Package Management</DialogTitle>
              </div>

              {/* Right Side: Actions & Starting Price */}
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">

                {isAdmin && pricingMode === "packages" && hasPackages && (
                  <Button onClick={handleAddPackage} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Package
                  </Button>
                )}

                {/* Switch Button — ONLY when admin & pricing mode exists */}
                {isAdmin && (pricingMode === "packages" || pricingMode === "startingPrice") && (
                  <Button variant="outline" onClick={switchPricingMode}>
                    Switch to {pricingMode === "packages" ? "Starting Price" : "Packages"}
                  </Button>
                )}

                {/* Close Button */}
                <button
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

            </div>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 py-6 max-h-[90dvh] overflow-y-auto">
            {loading ? (
              <div className="space-y-6">
                {/* Skeleton Loading States */}
                {pricingMode === "packages" ? (
                  viewMode === "card" ? (
                    <div className="grid grid-cols-1 gap-6">
                      <div className="flex items-center justify-center py-8 w-full">
                        <Loader2 className="w-8 h-8 animate-spin text-studio-gold" />
                        <span className="ml-3 text-muted-foreground">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-6">
                      <div className="flex items-center justify-center py-8 w-full">
                        <Loader2 className="w-8 h-8 animate-spin text-studio-gold" />
                        <span className="ml-3 text-muted-foreground">Loading...</span>
                      </div>
                    </div>
                    </div>
                  )
                ) : (
                  // Empty state skeleton
                  <div className="text-center py-16">
                     <div className="grid grid-cols-1 gap-6">
                      <div className="flex items-center justify-center py-8 w-full">
                        <Loader2 className="w-8 h-8 animate-spin text-studio-gold" />
                        <span className="ml-3 text-muted-foreground">Loading...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Packages Display */}
                {pricingMode === "packages" ? (
                  hasPackages ? (
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
                    // No packages in packages mode - should show empty state
                    <div className="text-center py-16">
                      <h3 className="text-lg font-semibold mb-2">No Packages Yet</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Create your first package to get started with package-based pricing.
                      </p>
                      {isAdmin && (
                        <Button onClick={handleAddPackage}>
                          Create First Package
                        </Button>
                      )}
                    </div>
                  )
                ) : pricingMode === "startingPrice" ? (
                  // Starting Price Mode Content
                  <div className="py-10">
                    <div className="max-w-2xl mx-auto space-y-6">


                      {/* PRICE CARD */}
                      {hasStartingPrice && (
                        <div className="relative rounded-xl p-6  shadow-sm flex flex-col items-center">

                          {/* TITLE & DESCRIPTION */}
                          <div className="mb-4 flex flex-col gap-2 items-center">
                            <h3 className="text-lg font-semibold">Starting Price</h3>
                            <p className="text-sm text-muted-foreground">
                              This is the minimum price clients see.
                            </p>
                          </div>

                          {/* PRICE DISPLAY */}
                          <div className="flex items-center gap-2 text-3xl font-bold mb-4">
                            {formatPrice(startingPrice, userCountry)}
                          </div>

                          {/* ADMIN BUTTONS - FIXED POSITIONING */}
                          {isAdmin && (
                            <div className="flex items-center gap-2 pt-4 ">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors border-red-800 hover:border-primary/30"
                                onClick={() => {
                                  setStartingPriceInput(startingPrice.toString());
                                  setIsStartingPriceModalOpen(true);
                                }}

                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border-border/40 hover:border-destructive/30"
                                onClick={handleDeleteStartingPrice}
                                disabled={isDeletingStartingPrice}

                              >
                                {isDeletingStartingPrice ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </>
                                )}
                              </Button>
                            </div>
                          )}

                        </div>
                      )}

                    </div>
                  </div>
                ) : (
                  /* Empty State - No pricing method selected yet */

                  <div className="text-center py-16">
                    <h3 className="text-lg font-semibold mb-2">
                      {isAdmin
                        ? "How would you like to set your pricing?"
                        : "Pricing has not been set yet"}
                    </h3>

                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {isAdmin
                        ? "You can either enter a single starting price or create detailed packages. You can switch at anytime."
                        : "An admin will set up the pricing for this company. Please contact your admin if you need help."}
                    </p>

                    {isAdmin && (

                      <div className="flex justify-center items-center gap-3">
                        <Button
                          onClick={() => setIsStartingPriceModalOpen(true)}
                          variant="outline"
                        >
                          Add Starting Price
                        </Button>

                        <span className="text-sm text-muted-foreground">or</span>

                        <Button onClick={handleAddPackage} variant="outline">
                          Create Package
                        </Button>
                      </div>
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
          }} autoComplete="off">
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
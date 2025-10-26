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
import { Plus, X, DollarSign, Euro, PoundSterling, IndianRupee, Edit, Check } from "lucide-react";
import { PackageCard } from "@/components/PackageCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PackageType } from "./PackagesDialog";
import * as yup from "yup";
import { useAuth } from "@/context/AuthContext";

interface EditPackageDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package: PackageType;
  onSave: (pkg: PackageType) => void;
}

// Function to get currency symbol and formatting based on country
const getCurrencyConfig = (country?: string) => {
  const countryCode = country?.toLowerCase();
  
  switch (countryCode) {
    case 'us':
    case 'usa':
    case 'united states':
    case 'canada':
    case 'australia':
    case 'new zealand':
    case 'singapore':
    case 'hong kong':
      return { symbol: '$', code: 'USD', icon: DollarSign };
    
    case 'gb':
    case 'uk':
    case 'united kingdom':
      return { symbol: '£', code: 'GBP', icon: PoundSterling };
    
    case 'eu':
    case 'germany':
    case 'france':
    case 'italy':
    case 'spain':
    case 'netherlands':
    case 'belgium':
    case 'ireland':
      return { symbol: '€', code: 'EUR', icon: Euro };
    
    case 'in':
    case 'india':
      return { symbol: '₹', code: 'INR', icon: IndianRupee };
    
    // Add more countries as needed
    default:
      return { symbol: '$', code: 'USD', icon: DollarSign };
  }
};

// Yup validation schema
const packageSchema = yup.object({
  name: yup
    .string()
    .required("Package name is required")
    .min(2, "Package name must be at least 2 characters")
    .max(50, "Package name must be less than 50 characters"),
  price: yup
    .string()
    .required("Price is required")
    .test("is-valid-price", "Price must be a valid number", (value) => {
      if (!value) return false;
      const num = parseFloat(value);
      return !isNaN(num) && num >= 0;
    }),
  duration: yup
    .string()
    .required("Duration is required")
    .min(1, "Duration is required"),
  popular: yup.boolean().required(),
  features: yup
    .array()
    .of(yup.string().min(1, "Feature cannot be empty"))
    .required(),
  addOns: yup.array().of(
    yup.object({
      name: yup
        .string()
        .required("Add-on name is required")
        .min(1, "Add-on name cannot be empty"),
      price: yup
        .string()
        .required("Add-on price is required")
        .test("is-valid-price", "Add-on price must be a valid number", (value) => {
          if (!value) return false;
          const num = parseFloat(value);
          return !isNaN(num) && num >= 0;
        }),
    })
  ),
});

type ValidationErrors = {
  [key: string]: string | undefined;
};

export function EditPackageDrawer({ open, onOpenChange, package: initialPackage, onSave }: EditPackageDrawerProps) {
  const { user } = useAuth();
  const userCountry = user?.data?.country;
  const currencyConfig = getCurrencyConfig(userCountry);
  const CurrencyIcon = currencyConfig.icon;

  const [editedPackage, setEditedPackage] = useState<PackageType>(initialPackage);
  const [newFeature, setNewFeature] = useState("");
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // States for inline editing
  const [editingFeatureIndex, setEditingFeatureIndex] = useState<number | null>(null);
  const [editingFeatureValue, setEditingFeatureValue] = useState("");
  const [editingAddonIndex, setEditingAddonIndex] = useState<number | null>(null);
  const [editingAddonName, setEditingAddonName] = useState("");
  const [editingAddonPrice, setEditingAddonPrice] = useState("");

  useEffect(() => {
    setEditedPackage(initialPackage);
    setErrors({});
    setHasSubmitted(false);
    setEditingFeatureIndex(null);
    setEditingAddonIndex(null);
  }, [initialPackage]);

  // Validate individual field and update errors
  const validateField = async (field: string, value: any) => {
    if (!hasSubmitted) return; // Only validate if user has tried to submit

    try {
      await packageSchema.validateAt(field, { [field]: value });
      // Remove error for this field if validation passes
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setErrors(prev => ({
          ...prev,
          [field]: error.message
        }));
      }
    }
  };

  // Validate entire form
  const validateAll = async (): Promise<boolean> => {
    try {
      await packageSchema.validate(editedPackage, { abortEarly: false });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors: ValidationErrors = {};
        error.inner.forEach(err => {
          if (err.path) {
            newErrors[err.path] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSave = async () => {
    setHasSubmitted(true);
    const isValid = await validateAll();
    if (isValid) {
      onSave(editedPackage);
    }
  };

  const handleFieldChange = (field: keyof PackageType, value: any) => {
    setEditedPackage(prev => ({ ...prev, [field]: value }));
    
    // Only validate if user has tried to submit
    if (hasSubmitted) {
      validateField(field, value);
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      const updatedFeatures = [...editedPackage.features, newFeature.trim()];
      setEditedPackage(prev => ({
        ...prev,
        features: updatedFeatures
      }));
      setNewFeature("");
      
      // Only validate if user has tried to submit
      if (hasSubmitted) {
        validateField("features", updatedFeatures);
      }
    }
  };

  const handleRemoveFeature = (index: number) => {
    const updatedFeatures = editedPackage.features.filter((_, i) => i !== index);
    setEditedPackage(prev => ({
      ...prev,
      features: updatedFeatures
    }));
    
    // Only validate if user has tried to submit
    if (hasSubmitted) {
      validateField("features", updatedFeatures);
    }
  };

  // Feature editing functions
  const startEditingFeature = (index: number) => {
    setEditingFeatureIndex(index);
    setEditingFeatureValue(editedPackage.features[index]);
  };

  const saveEditingFeature = () => {
    if (editingFeatureIndex !== null && editingFeatureValue.trim()) {
      const updatedFeatures = [...editedPackage.features];
      updatedFeatures[editingFeatureIndex] = editingFeatureValue.trim();
      
      setEditedPackage(prev => ({
        ...prev,
        features: updatedFeatures
      }));
      
      setEditingFeatureIndex(null);
      setEditingFeatureValue("");
      
      // Only validate if user has tried to submit
      if (hasSubmitted) {
        validateField("features", updatedFeatures);
      }
    }
  };

  const cancelEditingFeature = () => {
    setEditingFeatureIndex(null);
    setEditingFeatureValue("");
  };

  const handleAddAddon = () => {
    if (newAddonName.trim() && newAddonPrice.trim()) {
      const updatedAddons = [
        ...editedPackage.addOns, 
        { name: newAddonName.trim(), price: newAddonPrice.trim() }
      ];
      setEditedPackage(prev => ({
        ...prev,
        addOns: updatedAddons
      }));
      setNewAddonName("");
      setNewAddonPrice("");
      
      // Only validate if user has tried to submit
      if (hasSubmitted) {
        validateField("addOns", updatedAddons);
      }
    }
  };

  const handleRemoveAddon = (index: number) => {
    const updatedAddons = editedPackage.addOns.filter((_, i) => i !== index);
    setEditedPackage(prev => ({
      ...prev,
      addOns: updatedAddons
    }));
    
    // Only validate if user has tried to submit
    if (hasSubmitted) {
      validateField("addOns", updatedAddons);
    }
  };

  // Add-on editing functions
  const startEditingAddon = (index: number) => {
    setEditingAddonIndex(index);
    setEditingAddonName(editedPackage.addOns[index].name);
    setEditingAddonPrice(editedPackage.addOns[index].price);
  };

  const saveEditingAddon = () => {
    if (editingAddonIndex !== null && editingAddonName.trim() && editingAddonPrice.trim()) {
      const updatedAddons = [...editedPackage.addOns];
      updatedAddons[editingAddonIndex] = {
        name: editingAddonName.trim(),
        price: editingAddonPrice.trim()
      };
      
      setEditedPackage(prev => ({
        ...prev,
        addOns: updatedAddons
      }));
      
      setEditingAddonIndex(null);
      setEditingAddonName("");
      setEditingAddonPrice("");
      
      // Only validate if user has tried to submit
      if (hasSubmitted) {
        validateField("addOns", updatedAddons);
      }
    }
  };

  const cancelEditingAddon = () => {
    setEditingAddonIndex(null);
    setEditingAddonName("");
    setEditingAddonPrice("");
  };

  // Helper to check if a field has an error
  const hasError = (field: string): boolean => {
    return !!errors[field];
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
                  {initialPackage.price ? `Edit ${initialPackage.name}` : "Create New Package"}
                </SheetTitle>
              </SheetHeader>

              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Package Name</Label>
                  <Input
                    id="name"
                    value={editedPackage.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    placeholder="e.g., Premium Wedding Package"
                  />
                  {hasError("name") && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      Price ({currencyConfig.symbol})
                    </Label>
                    <div className="relative">
                      <CurrencyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        value={editedPackage.price}
                        onChange={(e) => handleFieldChange("price", e.target.value)}
                        placeholder="2500"
                        className="pl-10"
                      />
                    </div>
                    {hasError("price") && (
                      <p className="text-sm text-destructive">{errors.price}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      value={editedPackage.duration}
                      onChange={(e) => handleFieldChange("duration", e.target.value)}
                      placeholder="e.g., 8 hours"
                    />
                    {hasError("duration") && (
                      <p className="text-sm text-destructive">{errors.duration}</p>
                    )}
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
                    onCheckedChange={(checked) => handleFieldChange("popular", checked)}
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <Label>Features</Label>
                
                {editedPackage.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {editingFeatureIndex === index ? (
                      <>
                        <Input 
                          value={editingFeatureValue}
                          onChange={(e) => setEditingFeatureValue(e.target.value)}
                          className="flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditingFeature();
                            if (e.key === 'Escape') cancelEditingFeature();
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={saveEditingFeature}
                          disabled={!editingFeatureValue.trim()}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={cancelEditingFeature}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input value={feature} disabled className="flex-1" />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditingFeature(index)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFeature(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}

                {hasError("features") && (
                  <p className="text-sm text-destructive">{errors.features}</p>
                )}

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
                    {editingAddonIndex === index ? (
                      <>
                        <Input
                          value={editingAddonName}
                          onChange={(e) => setEditingAddonName(e.target.value)}
                          placeholder="Add-on name"
                          className="flex-1"
                          autoFocus
                        />
                        <div className="relative w-24">
                          <CurrencyIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                          <Input 
                            value={editingAddonPrice}
                            onChange={(e) => setEditingAddonPrice(e.target.value)}
                            placeholder="Price"
                            type="number"
                            className="pl-7"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={saveEditingAddon}
                          disabled={!editingAddonName.trim() || !editingAddonPrice.trim()}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={cancelEditingAddon}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input value={addon.name} disabled className="flex-1" />
                        <div className="relative w-24">
                          <CurrencyIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                          <Input 
                            value={addon.price} 
                            disabled 
                            className="pl-7" 
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditingAddon(index)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAddon(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}

                {hasError("addOns") && (
                  <p className="text-sm text-destructive">{errors.addOns}</p>
                )}

                <div className="flex gap-2">
                  <Input
                    value={newAddonName}
                    onChange={(e) => setNewAddonName(e.target.value)}
                    placeholder="Add-on name..."
                    className="flex-1"
                  />
                  <div className="relative">
                    <CurrencyIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input
                      value={newAddonPrice}
                      onChange={(e) => setNewAddonPrice(e.target.value)}
                      placeholder="Price"
                      type="number"
                      className="w-24 pl-7"
                    />
                  </div>
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
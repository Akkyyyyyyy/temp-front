import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, MoreVertical, Pencil, Copy, Trash2, DollarSign, Euro, PoundSterling, IndianRupee } from "lucide-react";
import { PackageType } from "../components/PackagesDialog";
import { useAuth } from "@/context/AuthContext";

interface PackageCardProps {
  package: PackageType;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isPreview?: boolean;
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
      return { symbol: '$', code: 'USD', icon: DollarSign, format: 'en-US' };

    case 'gb':
    case 'uk':
    case 'united kingdom':
      return { symbol: '£', code: 'GBP', icon: PoundSterling, format: 'en-GB' };

    case 'eu':
    case 'germany':
    case 'france':
    case 'italy':
    case 'spain':
    case 'netherlands':
    case 'belgium':
    case 'ireland':
      return { symbol: '€', code: 'EUR', icon: Euro, format: 'de-DE' };

    case 'in':
    case 'india':
      return { symbol: '₹', code: 'INR', icon: IndianRupee, format: 'en-IN' };

    // Add more countries as needed
    default:
      return { symbol: '$', code: 'USD', icon: DollarSign, format: 'en-US' };
  }
};

// Function to format price with proper currency formatting - handles string input
const formatPrice = (price: string | number, country?: string) => {
  const config = getCurrencyConfig(country);

  // Convert string to number, handle empty strings and invalid values
  const numericPrice = typeof price === 'string'
    ? parseFloat(price) || 0
    : price || 0;

  // For currencies like JPY that typically don't use decimal places
  if (config.code === 'JPY' || config.code === 'KRW') {
    return new Intl.NumberFormat(config.format, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericPrice);
  }

  return new Intl.NumberFormat(config.format, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericPrice);
};

export function PackageCard({
  package: pkg,
  onEdit,
  onDuplicate,
  onDelete,
  isPreview = false,
}: PackageCardProps) {
  const { user } = useAuth();
  const userCountry = user?.data?.company.country;
  const currencyConfig = getCurrencyConfig(userCountry);
  const CurrencyIcon = currencyConfig.icon;

  return (
    <Card
      className={`relative ${pkg.popular
          ? "border-primary shadow-lg ring-2 ring-primary/20"
          : "border-border"
        }`}
    >
      {pkg.popular && !isPreview && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
          Most Popular
        </Badge>
      )}

      <CardHeader className="text-center pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">{pkg.name || "Untitled Package"}</h3>
            <div className="flex items-center justify-center gap-1 text-3xl font-bold text-primary mb-1">
              {formatPrice(pkg.price, userCountry)}
            </div>
            <p className="text-sm text-muted-foreground">{pkg.duration || "No duration set"}</p>
          </div>

          {!isPreview && (
            <DropdownMenu>
              {
                user.data.isAdmin &&
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
              }

              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Features */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-foreground">Features</h4>
          {pkg.features.length > 0 ? (
            <ul className="space-y-2">
              {pkg.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No features added</p>
          )}
        </div>

        {/* Add-ons */}
        {pkg.addOns.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-semibold mb-2 text-foreground">Add-ons Available</h4>
            <ul className="space-y-1">
              {pkg.addOns.map((addon, index) => (
                <li key={index} className="flex items-center gap-1 text-sm text-muted-foreground">
                  • {addon.name}: {formatPrice(addon.price, userCountry)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      {!isPreview && (
        user.data.isAdmin &&
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={onEdit}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit Package
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
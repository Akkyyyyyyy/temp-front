import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, MoreVertical, Pencil, Copy, Trash2 } from "lucide-react";
import { PackageType } from "@/pages/Packages";

interface PackageCardProps {
  package: PackageType;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isPreview?: boolean;
}

export function PackageCard({ package: pkg, onEdit, onDuplicate, onDelete, isPreview = false }: PackageCardProps) {
  return (
    <Card
      className={`relative ${
        pkg.popular
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
            <div className="text-3xl font-bold text-primary mb-1">
              ${pkg.price || "0"}
            </div>
            <p className="text-sm text-muted-foreground">{pkg.duration || "No duration set"}</p>
          </div>
          
          {!isPreview && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
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
                <li key={index} className="text-sm text-muted-foreground">
                  • {addon.name}: ${addon.price}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      {!isPreview && (
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
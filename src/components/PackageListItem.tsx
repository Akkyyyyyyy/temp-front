import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pencil, Copy, Trash2 } from "lucide-react";
import { PackageType } from "@/pages/Packages";

interface PackageListItemProps {
  package: PackageType;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function PackageListItem({ package: pkg, onEdit, onDuplicate, onDelete }: PackageListItemProps) {
  return (
    <Card className="p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 flex-1">
          {/* Name and Badge */}
          <div className="min-w-[180px]">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{pkg.name || "Untitled Package"}</h3>
              {pkg.popular && (
                <Badge className="bg-primary text-primary-foreground text-xs">Popular</Badge>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="min-w-[120px]">
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="font-bold text-xl text-primary">${pkg.price || "0"}</p>
          </div>

          {/* Duration */}
          <div className="min-w-[120px]">
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-medium">{pkg.duration || "Not set"}</p>
          </div>

          {/* Features Count */}
          <div className="min-w-[100px]">
            <p className="text-sm text-muted-foreground">Features</p>
            <p className="font-medium">{pkg.features.length}</p>
          </div>

          {/* Add-ons Count */}
          <div className="min-w-[100px]">
            <p className="text-sm text-muted-foreground">Add-ons</p>
            <p className="font-medium">{pkg.addOns.length}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onDuplicate}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
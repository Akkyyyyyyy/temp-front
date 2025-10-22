import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FinancialBreakdownDialog } from './FinancialBreakdownDialog';

interface FinancialData {
  revenue: string;
  costs: string;
  profit: string;
}

interface FinancialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookings?: Array<{
    startHour: number;
    endHour: number;
    projectName: string;
    memberName: string;
    memberPhoto: string;
    color: string;
  }>;
}

export function FinancialDialog({ open, onOpenChange, bookings = [] }: FinancialDialogProps) {
  const [financialData, setFinancialData] = useState<FinancialData>({
    revenue: '',
    costs: '',
    profit: ''
  });
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Load saved financial data
  useEffect(() => {
    const savedData = localStorage.getItem('projectFinancials');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFinancialData(parsed);
      } catch (error) {
        console.error('Error loading financial data:', error);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Store privately in localStorage
    localStorage.setItem('projectFinancials', JSON.stringify(financialData));
    onOpenChange(false);
  };

  const handleInputChange = (field: keyof FinancialData, value: string) => {
    setFinancialData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Financial Details (Private)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="revenue">Revenue</Label>
            <Input
              id="revenue"
              type="number"
              placeholder="Enter revenue amount"
              value={financialData.revenue}
              onChange={(e) => handleInputChange('revenue', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="costs">Costs</Label>
            <Input
              id="costs"
              type="number"
              placeholder="Enter costs amount"
              value={financialData.costs}
              onChange={(e) => handleInputChange('costs', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="profit">Profit</Label>
            <Input
              id="profit"
              type="number"
              placeholder="Enter profit amount"
              value={financialData.profit}
              onChange={(e) => handleInputChange('profit', e.target.value)}
            />
          </div>

          <div className="flex justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowBreakdown(true)}>
              View Breakdown
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Financial Data</Button>
            </div>
          </div>
        </form>
      </DialogContent>
      
      <FinancialBreakdownDialog 
        open={showBreakdown} 
        onOpenChange={setShowBreakdown}
        bookings={bookings}
      />
    </Dialog>
  );
}
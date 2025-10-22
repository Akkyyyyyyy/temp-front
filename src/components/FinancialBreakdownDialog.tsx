import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, TrendingUp, TrendingDown, Calculator } from "lucide-react";

interface BookingFinancial {
  id: string;
  projectName: string;
  memberName: string;
  revenue: number;
  cost: number;
  profit: number;
  color: string;
}

interface FinancialBreakdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookings: Array<{
    startHour: number;
    endHour: number;
    projectName: string;
    memberName: string;
    memberPhoto: string;
    color: string;
  }>;
}

export function FinancialBreakdownDialog({ open, onOpenChange, bookings }: FinancialBreakdownDialogProps) {
  const [bookingFinancials, setBookingFinancials] = useState<BookingFinancial[]>([]);

  // Sample financial data for demonstration
  useEffect(() => {
    const sampleFinancials: BookingFinancial[] = bookings.map((booking, index) => ({
      id: `financial-${index}`,
      projectName: booking.projectName,
      memberName: booking.memberName,
      revenue: Math.floor(Math.random() * 3000) + 1000, // Random revenue between 1000-4000
      cost: Math.floor(Math.random() * 800) + 200, // Random cost between 200-1000
      profit: 0, // Will be calculated
      color: booking.color
    }));

    // Calculate profit for each booking
    sampleFinancials.forEach(financial => {
      financial.profit = financial.revenue - financial.cost;
    });

    setBookingFinancials(sampleFinancials);
  }, [bookings]);

  const totalRevenue = bookingFinancials.reduce((sum, booking) => sum + booking.revenue, 0);
  const totalCost = bookingFinancials.reduce((sum, booking) => sum + booking.cost, 0);
  const totalProfit = totalRevenue - totalCost;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Financial Breakdown
          </DialogTitle>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
              <TrendingDown className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalCost)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              <Calculator className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalProfit)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Individual Booking Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Booking Breakdown</h3>
          
          {bookingFinancials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bookings found for the selected day
            </div>
          ) : (
            <div className="space-y-3">
              {bookingFinancials.map((booking) => (
                <Card key={booking.id} className="border-l-4" style={{ borderLeftColor: booking.color.replace('bg-', '#') }}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-sm">{booking.projectName}</h4>
                        <p className="text-xs text-muted-foreground">Photographer: {booking.memberName}</p>
                      </div>
                      <Badge variant="outline" className={booking.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {booking.profit >= 0 ? 'Profitable' : 'Loss'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Revenue</p>
                        <p className="font-semibold text-green-600">{formatCurrency(booking.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Cost</p>
                        <p className="font-semibold text-red-600">{formatCurrency(booking.cost)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Profit</p>
                        <p className={`font-semibold ${booking.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(booking.profit)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
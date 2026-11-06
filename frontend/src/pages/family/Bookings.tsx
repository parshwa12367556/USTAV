
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, ArrowRight } from "lucide-react";
import { bookingService } from "@/services/booking.service";
import { formatCurrency } from "@/utils/format";
import { BOOKING_STATUSES } from "@/constants";

export default function FamilyBookings() {
  const { data: bookings } = useQuery({ queryKey: ["familyBookings"], queryFn: () => bookingService.list("fam_001") });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">My Bookings</h1>
          <p className="text-muted-foreground">Track your venue, catering and decoration bookings.</p>
        </div>
        <Link to="/family/venues" className="bg-burgundy text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-deep-burgundy transition-colors flex items-center gap-2">
          <ArrowRight className="h-3 w-3" /> New Booking
        </Link>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr><th className="px-4 py-3 font-medium">Reference</th><th className="px-4 py-3 font-medium">Vendor / Service</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium text-right">Amount</th><th className="px-4 py-3 font-medium text-right">Paid</th><th className="px-4 py-3 font-medium text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(bookings || []).map((b) => (
              <tr key={b.id} className="hover:bg-muted/50">
                <td className="px-4 py-4"><span className="text-xs font-medium text-muted-foreground block">{b.bookingReference}</span></td>
                <td className="px-4 py-4">{b.vendorName} <span className="text-xs text-muted-foreground block">{b.serviceCategory}</span></td>
                <td className="px-4 py-4">{b.date}</td>
                <td className="px-4 py-4"><Badge variant="outline">{b.status.replace("_"," ")}</Badge></td>
                <td className="px-4 py-4 text-right font-medium">{formatCurrency(b.quotedAmount)}</td>
                <td className="px-4 py-4 text-right">{formatCurrency(b.advancePaid)}</td>
                <td className="px-4 py-4 text-right">
                  <Link to={"/family/bookings/" + b.id} className="text-sm font-medium text-burgundy hover:underline">Details</Link>
                </td>
              </tr>
            ))}
            {(bookings || []).length === 0 && <tr><td colSpan="7" className="px-4 py-8 text-center text-muted-foreground">No bookings yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[ {label:"Total Booked", value: bookings?.reduce((a,b)=>a+b.quotedAmount,0) || 0}, {label:"Advance Paid", value: bookings?.reduce((a,b)=>a+b.advancePaid,0) || 0}, {label:"Remaining", value: bookings?.reduce((a,b)=>a+b.remainingAmount,0) || 0} ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{formatCurrency(s.value)}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


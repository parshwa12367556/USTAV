
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/utils/format";

const bookings = [
  { ref: "UTS-2025-0001", customer: "Sharma Family", service: "Royal Palace Banquet Hall", date: "16 Feb 2026", status: "confirmed", quoted: 141600, advance: 70800, remaining: 70800 },
  { ref: "UTS-2025-0002", customer: "Sharma Family", service: "Floral Dreams Mehendi Decor", date: "15 Feb 2026", status: "confirmed", quoted: 90000, advance: 45000, remaining: 45000 },
];

export default function VendorBookings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Bookings</h1>
        <p className="text-muted-foreground">Manage your confirmed and pending bookings.</p>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr><th className="px-4 py-3 font-medium">Reference</th><th className="px-4 py-3 font-medium">Customer</th><th className="px-4 py-3 font-medium">Service</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium text-right">Quoted</th><th className="px-4 py-3 font-medium text-right">Advance</th><th className="px-4 py-3 font-medium text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings.map((b) => (
              <tr key={b.ref} className="hover:bg-muted/50">
                <td className="px-4 py-4">{b.ref}</td>
                <td className="px-4 py-4">{b.customer}</td>
                <td className="px-4 py-4">{b.service}</td>
                <td className="px-4 py-4">{b.date}</td>
                <td className="px-4 py-4"><Badge variant="success">{b.status}</Badge></td>
                <td className="px-4 py-4 text-right">{formatCurrency(b.quoted)}</td>
                <td className="px-4 py-4 text-right">{formatCurrency(b.advance)}</td>
                <td className="px-4 py-4 text-right">
                  <Link to={"/vendor/bookings/" + b.ref} className="text-sm font-medium text-burgundy hover:underline">Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format";

const bookings = [
  { ref: "UTS-2025-0001", family: "Sharma Family", vendor: "Royal Palace Banquet Hall", service: "Venue", date: "16 Feb 2026", status: "confirmed", amount: 141600 },
  { ref: "UTS-2025-0002", family: "Sharma Family", vendor: "Floral Dreams", service: "Decoration", date: "15 Feb 2026", status: "confirmed", amount: 90000 },
];

export default function AdminBookings() {
  const [q, setQ] = useState("");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-serif font-bold">Bookings</h1>
        <Badge>{bookings.length} total</Badge>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search bookings" value={q} onChange={(e)=>setQ(e.target.value)} className="pl-10" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr><th className="px-4 py-3 font-medium">Reference</th><th className="px-4 py-3 font-medium">Family</th><th className="px-4 py-3 font-medium">Vendor</th><th className="px-4 py-3 font-medium">Service</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium text-center">Status</th><th className="px-4 py-3 font-medium text-right">Amount</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings.filter((b)=>b.ref.toLowerCase().includes(q.toLowerCase()) || b.family.toLowerCase().includes(q.toLowerCase())).map((b) => (
              <tr key={b.ref} className="hover:bg-muted/50">
                <td className="px-4 py-4">{b.ref}</td>
                <td className="px-4 py-4">{b.family}</td>
                <td className="px-4 py-4">{b.vendor}</td>
                <td className="px-4 py-4">{b.service}</td>
                <td className="px-4 py-4">{b.date}</td>
                <td className="px-4 py-4 text-center"><Badge variant="success">{b.status}</Badge></td>
                <td className="px-4 py-4 text-right">{formatCurrency(b.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


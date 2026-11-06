
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/format";

const rows = [
  { category: "Venues", rate: "5%", collected: 42500, pending: 8500 },
  { category: "Catering", rate: "5%", collected: 31000, pending: 6200 },
  { category: "Decoration", rate: "5%", collected: 18000, pending: 3600 },
  { category: "Photography", rate: "5%", collected: 12000, pending: 2400 },
];

export default function AdminCommissions() {
  const [q, setQ] = useState("");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-serif font-bold">Commissions</h1>
        <Badge>Platform fee: 5%</Badge>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search categories" value={q} onChange={(e)=>setQ(e.target.value)} className="pl-10" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium text-center">Commission Rate</th><th className="px-4 py-3 font-medium text-right">Collected</th><th className="px-4 py-3 font-medium text-right">Pending</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.filter((r)=>r.category.toLowerCase().includes(q.toLowerCase())).map((r) => (
              <tr key={r.category} className="hover:bg-muted/50">
                <td className="px-4 py-4">{r.category}</td>
                <td className="px-4 py-4 text-center">{r.rate}</td>
                <td className="px-4 py-4 text-right">{formatCurrency(r.collected)}</td>
                <td className="px-4 py-4 text-right">{formatCurrency(r.pending)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-6 rounded-xl border border-border bg-burgundy/5 text-burgundy/90">
        <p className="text-sm">Commissions are calculated on confirmed bookings and paid out to the platform per settlement cycle.</p>
      </div>
    </div>
  );
}


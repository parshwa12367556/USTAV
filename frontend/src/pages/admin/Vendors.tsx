
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const vendors = [
  { id: "v1", business: "Royal Banquet Hall", category: "Marriage Hall", city: "Delhi", verified: true, rating: 4.7 },
  { id: "v2", business: "Floral Dreams", category: "Decoration", city: "Delhi", verified: true, rating: 4.8 },
  { id: "v3", business: "Royal Spice Caterers", category: "Catering", city: "Delhi", verified: false, rating: 4.5 },
];

export default function AdminVendors() {
  const [q, setQ] = useState("");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-serif font-bold">Vendors</h1>
        <Badge>{vendors.length} total</Badge>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search vendors" value={q} onChange={(e)=>setQ(e.target.value)} className="pl-10" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr><th className="px-4 py-3 font-medium">Business</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">City</th><th className="px-4 py-3 font-medium text-center">Rating</th><th className="px-4 py-3 font-medium text-center">Verified</th><th className="px-4 py-3 font-medium text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vendors.filter((v)=>v.business.toLowerCase().includes(q.toLowerCase())).map((v) => (
              <tr key={v.id} className="hover:bg-muted/50">
                <td className="px-4 py-4"><div className="font-medium text-foreground">{v.business}</div></td>
                <td className="px-4 py-4">{v.category}</td>
                <td className="px-4 py-4">{v.city}</td>
                <td className="px-4 py-4 text-center">{v.rating}</td>
                <td className="px-4 py-4 text-center"><Badge variant={v.verified?"success":"outline"}>{v.verified ? "Yes" : "No"}</Badge></td>
                <td className="px-4 py-4 text-right"><Button size="sm" variant="outline">View</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


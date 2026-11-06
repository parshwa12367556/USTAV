
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const venues = [
  { id: "n1", name: "Royal Palace Banquet Hall", type: "Banquet Hall", city: "Delhi", capacity: 500, price: "?85,000/day" },
  { id: "n2", name: "Grand Mandap Garden", type: "Garden", city: "Delhi", capacity: 700, price: "?60,000/day" },
  { id: "n3", name: "Heritage Convention Centre", type: "Convention Centre", city: "Mumbai", capacity: 1000, price: "?1,50,000/day" },
];

export default function AdminVenues() {
  const [q, setQ] = useState("");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-serif font-bold">Venues</h1>
        <Badge>{venues.length} listed</Badge>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search venues" value={q} onChange={(e)=>setQ(e.target.value)} className="pl-10" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr><th className="px-4 py-3 font-medium">Venue</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">City</th><th className="px-4 py-3 font-medium text-center">Capacity</th><th className="px-4 py-3 font-medium text-center">Price</th><th className="px-4 py-3 font-medium text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {venues.filter((v)=>v.name.toLowerCase().includes(q.toLowerCase())).map((v) => (
              <tr key={v.id} className="hover:bg-muted/50">
                <td className="px-4 py-4"><div className="font-medium text-foreground">{v.name}</div></td>
                <td className="px-4 py-4">{v.type}</td>
                <td className="px-4 py-4">{v.city}</td>
                <td className="px-4 py-4 text-center">{v.capacity}</td>
                <td className="px-4 py-4 text-center">{v.price}</td>
                <td className="px-4 py-4 text-right"><Button size="sm" variant="outline">Edit</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const families = [
  { id: "f1", name: "Sharma Family", city: "Delhi", events: 2, members: 3, owner: "Rajesh Sharma", joined: "2025-06-12" },
  { id: "f2", name: "Patel Family", city: "Ahmedabad", events: 1, members: 4, owner: "Ketan Patel", joined: "2025-08-01" },
  { id: "f3", name: "Reddy Family", city: "Hyderabad", events: 1, members: 2, owner: "Suresh Reddy", joined: "2025-09-10" },
];

export default function AdminFamilies() {
  const [q, setQ] = useState("");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-serif font-bold">Families</h1>
        <Badge>{families.length} total</Badge>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search families" value={q} onChange={(e)=>setQ(e.target.value)} className="pl-10" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr><th className="px-4 py-3 font-medium">Family</th><th className="px-4 py-3 font-medium">Owner</th><th className="px-4 py-3 font-medium">City</th><th className="px-4 py-3 font-medium text-center">Events</th><th className="px-4 py-3 font-medium text-center">Members</th><th className="px-4 py-3 font-medium text-right">Joined</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {families.filter((f)=>f.name.toLowerCase().includes(q.toLowerCase())).map((f) => (
              <tr key={f.id} className="hover:bg-muted/50">
                <td className="px-4 py-4"><div className="font-medium text-foreground">{f.name}</div></td>
                <td className="px-4 py-4">{f.owner}</td>
                <td className="px-4 py-4">{f.city}</td>
                <td className="px-4 py-4 text-center">{f.events}</td>
                <td className="px-4 py-4 text-center">{f.members}</td>
                <td className="px-4 py-4 text-right">{f.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


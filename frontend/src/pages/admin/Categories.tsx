
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  { name: "Venues", type: "Service", items: 9, slug: "venues" },
  { name: "Catering", type: "Service", items: 6, slug: "catering" },
  { name: "Decoration", type: "Service", items: 4, slug: "decoration" },
  { name: "Event Management", type: "Service", items: 3, slug: "event-management" },
  { name: "Photography", type: "Service", items: 3, slug: "photography" },
];

export default function AdminCategories() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-serif font-bold">Service Categories</h1>
        <Button className="bg-burgundy text-white flex items-center gap-2"><Plus className="h-4 w-4" /> Add Category</Button>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium text-center">Services</th><th className="px-4 py-3 font-medium text-center">Status</th><th className="px-4 py-3 font-medium text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((c) => (
              <tr key={c.name} className="hover:bg-muted/50">
                <td className="px-4 py-4"><div className="font-medium text-foreground">{c.name}</div></td>
                <td className="px-4 py-4">{c.type}</td>
                <td className="px-4 py-4 text-center">{c.items}</td>
                <td className="px-4 py-4 text-center"><Badge variant="success">Active</Badge></td>
                <td className="px-4 py-4 text-right"><Button size="sm" variant="outline">Edit</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


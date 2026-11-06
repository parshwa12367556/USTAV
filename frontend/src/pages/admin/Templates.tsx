
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const templates = [
  { id: "t1", name: "Royal Heritage", category: "Traditional", price: "Free", status: "Published" },
  { id: "t2", name: "Modern Minimal", category: "Modern", price: "Free", status: "Published" },
  { id: "t3", name: "Floral Elegance", category: "Floral", price: "?499", status: "Published" },
  { id: "t4", name: "Golden Royal", category: "Luxury", price: "?999", status: "Draft" },
];

export default function AdminTemplates() {
  const [q, setQ] = useState("");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-serif font-bold">Invitation Templates</h1>
        <Badge>{templates.length} templates</Badge>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search templates" value={q} onChange={(e)=>setQ(e.target.value)} className="pl-10" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.filter((t)=>t.name.toLowerCase().includes(q.toLowerCase())).map((t) => (
          <Card key={t.id}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.category}</div>
                </div>
                <Badge variant={t.status==="Published"?"success":"outline"}>{t.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{t.price}</div>
                <Button size="sm" variant="outline">Edit</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


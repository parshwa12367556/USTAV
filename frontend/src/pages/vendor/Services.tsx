
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit3 } from "lucide-react";

const services = [
  { name: "Banquet Hall Rental", category: "Venue", price: "?85,000/day", status: "Active" },
  { name: "Stage & Mandap Setup", category: "Decoration", price: "?25,000/event", status: "Active" },
  { name: "In-house Catering", category: "Catering", price: "?650/person", status: "Active" },
];

export default function VendorServices() {
  const [name, setName] = useState("");
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Services</h1>
          <p className="text-muted-foreground">Manage the services you offer to families.</p>
        </div>
        <Button className="bg-burgundy text-white flex items-center gap-2"><Plus className="h-4 w-4" /> Add Service</Button>
      </div>
      <div className="relative mb-6">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search services" value={name} onChange={(e)=>setName(e.target.value)} className="pl-10" />
      </div>
      <div className="space-y-3">
        {services.filter((s)=>s.name.toLowerCase().includes(name.toLowerCase())).map((s) => (
          <Card key={s.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-foreground">{s.price}</div>
                  <Badge variant={s.status==="Active"?"success":"default"}>{s.status}</Badge>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="outline"><Edit3 className="h-3 w-3" /></Button>
                  <Button size="sm" variant="destructive"><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}



import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const reviews = [
  { id: "r1", customer: "Sharma Family", vendor: "Royal Palace Banquet Hall", rating: 5, text: "Beautiful hall, great experience.", date: "12 Nov 2025", status: "approved" },
  { id: "r2", customer: "Patel Family", vendor: "Floral Dreams", rating: 4, text: "Lovely decoration, on time.", date: "08 Nov 2025", status: "approved" },
  { id: "r3", customer: "Reddy Family", vendor: "Royal Spice Caterers", rating: 3, text: "Food was good but service was slow.", date: "01 Nov 2025", status: "pending" },
];

export default function AdminReviews() {
  const [q, setQ] = useState("");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-serif font-bold">Reviews</h1>
        <Badge>{reviews.length} reviews</Badge>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search reviews" value={q} onChange={(e)=>setQ(e.target.value)} className="pl-10" />
      </div>
      <div className="space-y-4">
        {reviews.filter((r)=>r.customer.toLowerCase().includes(q.toLowerCase())).map((r) => (
          <Card key={r.id}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium text-foreground">{r.customer}</div>
                  <div className="text-sm text-muted-foreground">{r.vendor}  {r.date}</div>
                </div>
                <Badge variant={r.status==="approved"?"success":"outline"}>{r.status}</Badge>
              </div>
              <div className="flex items-center gap-1 text-gold mb-3">{[1,2,3,4,5].map((i)=> <Star key={i} className={`h-4 w-4 ${i<=r.rating?"fill-gold":"text-muted-foreground"}`} />)}</div>
              <p className="text-sm text-muted-foreground">{r.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


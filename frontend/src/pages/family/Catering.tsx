
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, Star, Users, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cateringService } from "@/services/catering.service";
import { CUISINE_TYPES } from "@/constants";

export default function FamilyCatering() {
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState("");
  const { data: caterers } = useQuery({ queryKey: ["familyCatering"], queryFn: () => cateringService.list() });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Catering Services</h1>
          <p className="text-muted-foreground">Multi-cuisine caterers with customizable menus.</p>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search caterer or cuisine" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
        </div>
        <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} className="border border-input bg-background rounded-md px-3 py-2 text-sm w-full lg:w-auto focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">All Cuisines</option>
          {CUISINE_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(caterers || []).filter((c) =>
          (c.businessName.toLowerCase().includes(query.toLowerCase()) || c.cuisine.some((x) => x.includes(query.toLowerCase()))) &&
          (!cuisine || c.cuisine.includes(cuisine))
        ).map((c) => (
          <Card key={c.id}>
            <div className="h-48 rounded-xl bg-muted mb-4 overflow-hidden">
              <img src={c.images[0]} alt={c.businessName} className="w-full h-full object-cover" />
            </div>
            <CardContent className="pt-4">
              <h3 className="font-semibold text-foreground">{c.businessName}</h3>
              <p className="text-sm text-muted-foreground">{c.city}  {c.cuisine.join(", ")}</p>
              <div className="mt-3 flex items-center gap-1 text-xs">
                <Star className="fill-gold text-gold" /> <span className="font-medium">{c.rating}</span> <span className="text-muted-foreground">({c.reviewCount})</span> <span className="ml-auto">from ?{c.pricePerPerson}/person</span>
              </div>
            </CardContent>
            <CardFooter>
              <Link to={"/family/catering"} className="w-full py-2 text-center text-sm font-semibold text-burgundy border border-border rounded-lg">Request Quote</Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}


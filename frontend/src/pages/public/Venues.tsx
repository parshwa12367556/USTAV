
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, MapPin, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { venueService } from "@/services/venue.service";
import { VENUE_TYPES } from "@/constants";

export default function Venues() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [guests, setGuests] = useState("");
  const { data: venues, isLoading } = useQuery({ queryKey: ["venues", query, type, guests], queryFn: () => venueService.list({ city: query, type }) });
  return (
    <section>
      <div className="py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-serif font-bold mb-3">Find the Perfect Venue</h1>
          <p className="text-muted-foreground">Marriage halls, banquet halls, gardens, convention centres and more.</p>
        </div>
      </div>
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-start mb-10">
            <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input placeholder="Search city or venue name" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" /></div>
            <select value={type} onChange={(e) => setType(e.target.value)} className="border border-input bg-background rounded-md px-3 py-2 text-sm"><option value="">All Types</option>{type.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
            <div className="flex-1 relative"><Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="number" placeholder="Guest count" value={guests} onChange={(e) => setGuests(e.target.value)} className="pl-10" /></div>
            <div className="flex gap-2"><Button onClick={() => setView("grid")} variant={view === "grid" ? "secondary" : "outline"} size="sm"><MapPin className="h-4 w-4" /></Button><Button onClick={() => setView("list")} variant={view === "list" ? "secondary" : "outline"} size="sm"><Users className="h-4 w-4" /></Button></div>
          </div>
          {isLoading ? <div className="h-96 flex items-center justify-center text-muted-foreground">Loading venues</div> : view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{(venues || []).map((v) => <Card key={v.id} className="overflow-hidden"><div className="h-48 overflow-hidden relative"><img src={v.images[0]} alt={v.name} className="w-full h-full object-cover" /><Badge className="absolute top-3 right-3">{v.isVerified ? "Verified" : "Listing"}</Badge></div><CardContent className="pt-4"><div className="flex items-center justify-between mb-2"><h3 className="font-semibold">{v.name}</h3><span className="text-sm font-semibold text-burgundy">Rs.{v.pricePerDay}</span></div><p className="text-sm text-muted-foreground">{v.city} | {v.capacity} guests</p><p className="text-xs text-muted-foreground mt-2">{v.facilities.slice(0,4).join(" | ")}</p></CardContent><CardFooter><Link to={"/venues/" + v.id} className="w-full py-2 text-center text-sm font-semibold text-burgundy border border-border rounded-lg">Details</Link></CardFooter></Card>)}<div className="text-muted-foreground text-center py-10">No venues found matching your criteria.</div></div>
          ) : (
            <div className="space-y-3">{(venues || []).map((v) => <Card key={v.id} className="overflow-hidden"><div className="grid grid-cols-12 gap-4"><div className="col-span-5 h-32 overflow-hidden relative flex-shrink-0"><img src={v.images[0]} alt={v.name} className="w-full h-full object-cover" /></div><div className="col-span-7 p-4"><div className="flex items-center justify-between mb-1"><h3 className="font-semibold">{v.name}</h3><span className="text-sm font-semibold text-burgundy">Rs.{v.pricePerDay}</span></div><p className="text-sm text-muted-foreground">{v.city} | Capacity {v.capacity}</p><div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><Star className="h-3 w-3 fill-gold text-gold" /> {v.rating} ({v.reviewCount}) &nbsp;|&nbsp; <Badge variant="outline" className="px-2 py-0.5">{v.isVerified ? "Verified" : "Unverified"}</Badge></div><div className="mt-4 flex gap-2"><Link to={"/venues/" + v.id} className="flex-1 py-2 text-center text-sm font-semibold text-burgundy border border-border rounded-lg">Details</Link><Button size="sm" className="flex-1 bg-burgundy text-white">Request Quote</Button></div></div></div></Card>)}</div>
          )}
        </div>
      </section>
    </section>
  );
}


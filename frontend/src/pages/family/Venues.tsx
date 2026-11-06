
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, MapPin, Users, Tag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { venueService } from "@/services/venue.service";
import { VENUE_TYPES } from "@/constants";

export default function FamilyVenues() {
  const [query, setQuery] = useState("");
  const { data: venues } = useQuery({ queryKey: ["familyVenues", query], queryFn: () => venueService.list({ city: query }) });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Find Venues</h1>
          <p className="text-muted-foreground">Marriage halls, banquet halls, gardens and convention centres.</p>
        </div>
        <Link to="/family/bookings" className="bg-burgundy text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-deep-burgundy transition-colors">My Bookings</Link>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search city or venue name" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(venues || []).map((v) => (
          <Card key={v.id}>
            <div className="h-48 overflow-hidden relative">
              <img src={v.images[0]} alt={v.name} className="w-full h-full object-cover" />
              <Badge className="absolute top-3 right-3">?{v.pricePerDay.toLocaleString()}/day</Badge>
            </div>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{v.name}</h3>
                <Badge variant={v.isVerified ? "success" : "outline"}>{v.isVerified ? "Verified" : "Listing"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{v.city}  Capacity {v.capacity}</p>
              <p className="text-xs text-muted-foreground mt-2">{v.facilities.slice(0,3).join("  ")}</p>
            </CardContent>
            <CardFooter className="gap-2">
              <Link to={"/venues/" + v.id} className="flex-1 py-2 text-center text-sm font-semibold text-burgundy border border-border rounded-lg">Details</Link>
              <Button size="sm" className="flex-1 bg-burgundy text-white">Request Quote</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}


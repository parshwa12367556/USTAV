
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapPin, Users, Tag, Star, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { venueService } from "@/services/venue.service";

export default function VenueDetail() {
  const { venueId } = useParams();
  const { data: venue, isLoading } = useQuery({
    queryKey: ["venue", venueId],
    queryFn: () => venueService.get(venueId || ""),
    enabled: !!venueId,
  });

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">Loading venue</div>;
  if (!venue) return <div className="p-10 text-center text-muted-foreground">Venue not found.</div>;

  return (
    <div className="flex flex-col">
      <section className="relative h-96 overflow-hidden">
        <img src={venue.images[0]} alt={venue.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2">
            <Badge>{venue.type.replace("_"," ")}</Badge>
            <Badge variant={venue.isVerified ? "success" : "outline"}>{venue.isVerified ? "Verified" : "Not Verified"}</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mt-2">{venue.name}</h1>
          <p className="text-secondary/90">{venue.city}, {venue.address}</p>
        </div>
      </section>

      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-muted/50"><div className="text-xs text-muted-foreground">Capacity</div><div className="font-semibold">{venue.capacity} guests</div></div>
              <div className="p-4 rounded-xl border border-border bg-muted/50"><div className="text-xs text-muted-foreground">Price / day</div><div className="font-semibold">?{venue.pricePerDay.toLocaleString()}</div></div>
              <div className="p-4 rounded-xl border border-border bg-muted/50"><div className="text-xs text-muted-foreground">Rating</div><div className="font-semibold">{venue.rating} <span className="text-xs fill-gold text-gold">?</span> ({venue.reviewCount})</div></div>
              <div className="p-4 rounded-xl border border-border bg-muted/50"><div className="text-xs text-muted-foreground">AC / Parking</div><div className="font-semibold">{venue.isAc ? "Yes" : "No"} / {venue.hasParking ? "Yes" : "No"}</div></div>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold mb-3">About</h3>
              <p className="text-muted-foreground">{venue.description}</p>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold mb-3">Facilities</h3>
              <div className="flex flex-wrap gap-2">
                {venue.facilities.map((f) => (
                  <Badge key={f} variant="outline" className="px-3 py-1.5">{f}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4">Book This Venue</h3>
                <p className="text-sm text-muted-foreground mb-4">Request a quotation for your event date.</p>
                <Link to={"/family/bookings"} className="w-full py-3 bg-burgundy text-white text-center rounded-lg text-sm font-semibold hover:bg-deep-burgundy transition-colors block">Request Quotation</Link>
                <p className="mt-4 text-xs text-muted-foreground">Sample data  booking is a demonstration until backend payments are connected.</p>
              </CardContent>
            </Card>
            <div className="p-4 rounded-xl border border-border bg-muted/50">
              <h4 className="font-semibold mb-3">Contact</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4" /><span className="text-sm">+91 98765 43210</span></div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /><span className="text-sm">{venue.address}</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


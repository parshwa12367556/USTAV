
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Star, MapPin, Tag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { vendorService } from "@/services/vendor.service";
import { useQuery } from "@tanstack/react-query";

export default function VendorDetail() {
  const { vendorId } = useParams();
  const { data: vendor, isLoading } = useQuery({
    queryKey: ["vendorDetail", vendorId],
    queryFn: () => vendorService.list().then((list) => list.find((v) => v.id === vendorId) || null),
    enabled: !!vendorId,
  });

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">Loading vendor</div>;
  if (!vendor) return <div className="p-10 text-center text-muted-foreground">Vendor not found.</div>;

  return (
    <div className="flex flex-col">
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="h-48 w-48 rounded-2xl bg-muted flex-shrink-0 flex items-center justify-center text-muted-foreground">Logo</div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-serif font-bold text-foreground">{vendor.businessName}</h1>
                <Badge variant={vendor.isVerified ? "success" : "outline"}>{vendor.isVerified ? "Verified" : "Listing"}</Badge>
              </div>
              <p className="text-muted-foreground">{vendor.city}  {vendor.category.replace("_"," ")}</p>
              <div className="mt-3 flex items-center gap-1 text-sm">
                <Star className="fill-gold text-gold" /> <span className="font-semibold">{vendor.rating}</span> <span className="text-muted-foreground">({vendor.reviewCount} reviews)</span> <span className="ml-auto text-muted-foreground">from ?{vendor.startingPrice.toLocaleString()}</span>
              </div>
              <p className="mt-4 text-muted-foreground">{vendor.description}</p>
              <div className="mt-6 flex gap-3">
                <Link to={"/family/quotations"} className="px-6 py-3 bg-burgundy text-white rounded-xl text-sm font-semibold hover:bg-deep-burgundy transition-colors block">Request Quotation</Link>
                <Button variant="outline" className="px-6 py-3 text-sm font-semibold">Contact Vendor</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-serif font-bold mb-6">Services</h2>
          <div className="flex flex-wrap gap-3">
            {vendor.services.map((s) => (
              <Badge key={s} variant="outline" className="px-4 py-2">{s}</Badge>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}


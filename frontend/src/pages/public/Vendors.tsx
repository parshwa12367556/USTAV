
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, Tag, Star, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { vendorService } from "@/services/vendor.service";
import { VENDOR_CATEGORIES } from "@/constants";

export default function Vendors() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const { data: vendors } = useQuery({
    queryKey: ["vendors", query, category],
    queryFn: () => vendorService.list(),
  });

  return (
    <div className="flex flex-col">
      <section className="py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-serif font-bold mb-3">Find Trusted Vendors</h1>
          <p className="text-muted-foreground">Caterers, decorators, photographers, transportation and more.</p>
        </div>
      </section>
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-end mb-10">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search vendor or business name" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-input bg-background rounded-md px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring w-full md:w-auto">
              <option value="">All Categories</option>
              {VENDOR_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(vendors || []).filter((v) =>
              (v.businessName.toLowerCase().includes(query.toLowerCase()) || v.category.includes(query.toLowerCase())) &&
              (!category || v.category === category)
            ).map((v) => (
              <Card key={v.id}>
                <div className="h-48 rounded-xl bg-muted mb-4 flex items-center justify-center text-muted-foreground overflow-hidden">
                  <img src={v.images[0] || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"} alt={v.businessName} className="w-full h-full object-cover" />
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{v.businessName}</h3>
                    <Badge variant="outline">{v.isVerified ? "Verified" : "Listing"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{v.city}  {VENDOR_CATEGORIES.find((c) => c.value === v.category)?.label || v.category}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs">
                    <Star className="fill-gold text-gold" /> <span className="font-medium">{v.rating}</span> <span className="text-muted-foreground">({v.reviewCount})</span> <span className="ml-auto">from ?{v.startingPrice.toLocaleString()}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link to={"/vendors/" + v.id} className="w-full py-2 text-center text-sm font-semibold text-burgundy">View Profile</Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}


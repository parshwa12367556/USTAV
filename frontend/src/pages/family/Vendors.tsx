
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, Star, Users, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { vendorService } from "@/services/vendor.service";
import { VENDOR_CATEGORIES } from "@/constants";

export default function FamilyVendors() {
  const [query, setQuery] = useState("");
  const { data: vendors } = useQuery({ queryKey: ["famVendors", query], queryFn: () => vendorService.list() });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Vendors</h1>
        <p className="text-muted-foreground">Discover and connect with verified service providers.</p>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search vendors by business name" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {VENDOR_CATEGORIES.map((c) => (
          <Button key={c.value} variant="outline" size="sm">{c.label}</Button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(vendors || []).filter((v) => v.businessName.toLowerCase().includes(query.toLowerCase())).map((v) => (
          <Card key={v.id}>
            <div className="h-48 rounded-xl bg-muted mb-4 overflow-hidden flex items-center justify-center text-muted-foreground">
              Portfolio
            </div>
            <CardContent className="pt-4">
              <h3 className="font-semibold text-foreground">{v.businessName}</h3>
              <p className="text-sm text-muted-foreground">{v.city}  {VENDOR_CATEGORIES.find((x) => x.value === v.category)?.label}</p>
              <div className="mt-3 flex items-center gap-1 text-xs">
                <Star className="fill-gold text-gold" /> <span className="font-medium">{v.rating}</span> <span className="text-muted-foreground">({v.reviewCount})</span> <span className="ml-auto">from ?{v.startingPrice.toLocaleString()}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Link to={"/vendors/" + v.id} className="w-full py-2 text-center text-sm font-semibold text-burgundy border border-border rounded-lg">View Profile</Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}



import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Star, Users, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { decorationService } from "@/services/decoration.service";
import { DECORATION_CATEGORIES } from "@/constants";

export default function FamilyDecoration() {
  const { data: decorators } = useQuery({ queryKey: ["familyDecoration"], queryFn: () => decorationService.list() });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Decoration Services</h1>
          <p className="text-muted-foreground">Floral, stage, mandap, haldi, mehendi and reception decoration.</p>
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        {DECORATION_CATEGORIES.map((c) => (
          <Button key={c.value} variant="outline" size="sm">{c.label}</Button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(decorators || []).map((d) => (
          <Card key={d.id}>
            <div className="h-48 rounded-xl bg-muted mb-4 overflow-hidden">
              <img src={d.images[0]} alt={d.businessName} className="w-full h-full object-cover" />
            </div>
            <CardContent className="pt-4">
              <h3 className="font-semibold text-foreground">{d.businessName}</h3>
              <p className="text-sm text-muted-foreground">{d.city}  {d.category.join(", ")}</p>
              <div className="mt-3 flex items-center gap-1 text-xs">
                <Star className="fill-gold text-gold" /> <span className="font-medium">{d.rating}</span> <span className="text-muted-foreground">({d.reviewCount})</span> <span className="ml-auto">from ?{d.startingPrice.toLocaleString()}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Link to={"/family/decoration"} className="w-full py-2 text-center text-sm font-semibold text-burgundy border border-border rounded-lg">Request Quote</Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}


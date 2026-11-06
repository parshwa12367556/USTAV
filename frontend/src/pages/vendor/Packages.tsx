
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Plus, Star } from "lucide-react";

const packages = [
  { name: "Silver Wedding Package", desc: "Venue + basic decoration for 200 guests", price: "?1,50,000", featured: false },
  { name: "Gold Wedding Package", desc: "Venue + decoration + catering for 400 guests", price: "?3,50,000", featured: true },
  { name: "Platinum Package", desc: "Complete wedding with all services", price: "?6,00,000", featured: false },
];

export default function VendorPackages() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-serif font-bold">Packages</h1>
        <Button className="bg-burgundy text-white flex items-center gap-2"><Plus className="h-4 w-4" /> Add Package</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((p) => (
          <Card key={p.name} className={p.featured ? "ring-2 ring-gold" : ""}>
            {p.featured && <div className="absolute -top-3 right-3 bg-gold text-gold-foreground text-[10px] font-bold uppercase px-2 py-1 rounded">Featured</div>}
            <CardContent className="pt-5 pb-4 relative">
              <h3 className="font-semibold text-foreground">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-6 text-3xl font-serif font-bold text-foreground">{p.price}</div>
            </CardContent>
            <CardFooter>
              <Button size="sm" className="w-1/2">Edit</Button>
              <Button size="sm" variant="outline" className="w-1/2">Details</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}



import { Card, CardContent } from "@/components/ui/card";
import { Star, Users } from "lucide-react";

const reviews = [
  { customer: "Sharma Family", rating: 5, text: "Beautiful hall and great service. Highly recommended!", date: "12 Nov 2025" },
  { customer: "Patel Family", rating: 4, text: "Good venue but catering could be more flexible.", date: "05 Nov 2025" },
];

export default function VendorReviews() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Reviews</h1>
        <p className="text-muted-foreground">Customer feedback and ratings for your business.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {reviews.map((r) => (
          <Card key={r.customer}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{r.customer}</span>
                  <div className="flex items-center gap-1 text-gold">{[1,2,3,4,5].map((i)=> <Star key={i} className={`h-4 w-4 ${i<=r.rating?"fill-gold":"text-muted-foreground"}`} />)}</div>
                </div>
                <div className="text-xs text-muted-foreground">{r.date}</div>
              </div>
              <p className="text-sm text-muted-foreground">{r.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


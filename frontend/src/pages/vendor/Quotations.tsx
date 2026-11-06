
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, ArrowRight, Clock } from "lucide-react";
import { formatCurrency } from "@/utils/format";

const quotations = [
  { id: "qt_001", customer: "Sharma Family", service: "Venue Rental", total: 141600, status: "submitted", submittedAt: "10 Nov 2025", valid: "7 days" },
  { id: "qt_002", customer: "Patel Family", service: "Decoration", total: 90000, status: "accepted", submittedAt: "08 Nov 2025", valid: "7 days" },
];

export default function VendorQuotations() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-serif font-bold">My Quotations</h1>
        <Button className="bg-burgundy text-white flex items-center gap-2"><Scale className="h-4 w-4" /> Submit Quotation</Button>
      </div>
      <div className="space-y-4">
        {quotations.map((q) => (
          <Card key={q.id} className="overflow-hidden">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{q.customer}</h3>
                  <p className="text-sm text-muted-foreground">{q.service}  Submitted {q.submittedAt}</p>
                </div>
                <Badge variant={q.status==="submitted"?"default":q.status==="accepted"?"success":"destructive"}>{q.status}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">{formatCurrency(q.total)}</div>
                  <div className="text-xs text-muted-foreground">Valid {q.valid}</div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 gap-2">
              {q.status === "submitted" && (
                <Button size="sm" className="flex-1" onClick={()=>{}}>Revise</Button>
              )}
              <Link to={"/vendor/bookings"} className="flex-1 py-2 text-center text-sm font-semibold text-burgundy border border-border rounded-lg">View Booking</Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="mt-8 p-6 rounded-xl border border-border bg-burgundy/5 text-burgundy/90">
        <p className="text-sm">Demo mode: Quotations are simulated. A quotation does not become a confirmed booking until the family accepts and pays the advance.</p>
      </div>
    </div>
  );
}


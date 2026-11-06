
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, ArrowRight, Mail, Clock } from "lucide-react";
import { quotationService } from "@/services/quotation.service";
import { formatCurrency } from "@/utils/format";

export default function FamilyQuotations() {
  const { data: requests } = useQuery({ queryKey: ["famQuotationRequests"], queryFn: () => quotationService.listRequests("fam_001") });
  const { data: quotations } = useQuery({ queryKey: ["famQuotations"], queryFn: () => quotationService.listQuotations("fam_001") });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Quotations</h1>
          <p className="text-muted-foreground">Request, compare and decide on vendor quotations.</p>
        </div>
        <Link to="/family/venues" className="bg-burgundy text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-deep-burgundy transition-colors flex items-center gap-2">
          <Mail className="h-3 w-3" /> Request New Quote
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Vendor Quotations Received</h2>
          <div className="space-y-4">
            {(quotations || []).map((q) => (
              <Card key={q.id} className="overflow-hidden">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{q.vendorName}</h3>
                      <p className="text-sm text-muted-foreground">{q.serviceCategory}  {q.packageName}</p>
                    </div>
                    <Badge variant={q.status === "submitted" ? "default" : q.status === "accepted" ? "success" : "destructive"}>{q.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{q.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-right">
                      <div className="text-lg font-bold text-foreground">{formatCurrency(q.total)}</div>
                      <div className="text-xs text-muted-foreground">Valid {q.validityDays} days</div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 gap-2">
                  <Button size="sm" onClick={() => { }} className="flex-1">Compare</Button>
                  <Button size="sm" className="flex-1 bg-burgundy text-white" onClick={() => { quotationService.accept(q.id); }}>Accept</Button>
                </CardFooter>
              </Card>
            ))}
            {(quotations || []).length === 0 && <div className="p-6 text-center text-muted-foreground">No quotations received yet.</div>}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Quotation Requests</h2>
          <div className="space-y-4">
            {(requests || []).map((r) => (
              <Card key={r.id}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{r.eventName}</h3>
                      <p className="text-sm text-muted-foreground">{r.functionName}  {r.serviceCategory}  {r.guestCount} guests</p>
                    </div>
                    <Badge variant="outline">{r.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.requirements}</p>
                </CardContent>
                <CardFooter>
                  <Link to={"/family/quotations"} className="w-full py-2 text-center text-sm font-semibold text-burgundy border border-border rounded-lg">View Quotes</Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


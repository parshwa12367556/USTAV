
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, Users, ArrowRight } from "lucide-react";

const requests = [
  { id: "qr_001", customer: "Sharma Family", event: "Aanya & Vihaan Wedding", fn: "Wedding", date: "16 Feb 2026", guests: 500, req: "Banquet hall with stage and bridal room", status: "open", deadline: "20 Nov 2025" },
  { id: "qr_002", customer: "Patel Family", event: "Rohan & Sneha Reception", fn: "Reception", date: "20 Mar 2026", guests: 300, req: "Outdoor garden with catering", status: "quoted", deadline: "25 Nov 2025" },
];

export default function VendorQuotationRequests() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Quotation Requests</h1>
        <p className="text-muted-foreground">Inquiries from families interested in your services.</p>
      </div>
      <div className="space-y-4">
        {requests.map((r) => (
          <Card key={r.id}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{r.customer}</h3>
                  <p className="text-sm text-muted-foreground">{r.event}  {r.fn}  {r.date}</p>
                </div>
                <Badge variant={r.status==="open"?"warning":"default"}>{r.status}</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div><div className="text-xs text-muted-foreground">Guests</div><div className="font-medium">{r.guests}</div></div>
                <div><div className="text-xs text-muted-foreground">Deadline</div><div className="font-medium">{r.deadline}</div></div>
              </div>
              <p className="text-sm text-muted-foreground">{r.req}</p>
            </CardContent>
            <CardFooter className="pt-4 gap-2">
              <Link to={"/vendor/quotations"} className="flex-1 py-2 text-center text-sm font-semibold text-burgundy border border-border rounded-lg">Submit Quote</Link>
              <Button size="sm" className="flex-1 bg-burgundy text-white">Details</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}


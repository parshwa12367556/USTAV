
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, ShieldCheck } from "lucide-react";

const vendors = [
  { id: "v1", business: "Royal Spice Caterers", category: "Catering", city: "Delhi", submitted: "2025-11-01", docs: ["GST Certificate", "Trade License", "FSSAI License"] },
  { id: "v2", business: "Green Valley Farmhouse", category: "Farmhouse", city: "Pune", submitted: "2025-11-03", docs: ["Property Deed", "Fire NOC"] },
];

export default function AdminVendorVerification() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-serif font-bold">Vendor Verification</h1>
        <Badge variant="warning">{vendors.length} pending</Badge>
      </div>
      <div className="space-y-4">
        {vendors.map((v) => (
          <Card key={v.id}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-semibold text-foreground">{v.business}</div>
                  <div className="text-sm text-muted-foreground">{v.category}  {v.city}  Submitted {v.submitted}</div>
                </div>
                <Badge variant="outline">Pending</Badge>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><FileText className="h-3 w-3" /> Documents</div>
                {v.docs.map((d) => (
                  <span key={d} className="text-xs px-2 py-1 rounded bg-muted">{d}</span>
                ))}
              </div>
              <div className="flex gap-3">
                <Button size="sm" variant="outline" onClick={()=>{}}>Request Info</Button>
                <Button size="sm" className="bg-burgundy text-white" onClick={()=>{}}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={()=>{}}>Reject</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="p-6 rounded-xl border border-border bg-muted/50 text-center text-muted-foreground">
        <ShieldCheck className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Admin verifies vendor identity and documents before they receive enquiries.</p>
      </div>
    </div>
  );
}


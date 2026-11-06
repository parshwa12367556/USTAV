
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { paymentService } from "@/services/payment.service";
import { formatCurrency } from "@/utils/format";

export default function FamilyPayments() {
  const { data: payments } = useQuery({ queryKey: ["familyPayments"], queryFn: () => paymentService.list() });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Payments</h1>
        <p className="text-muted-foreground">Track payments against your bookings and view invoices.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[ {label:"Total Paid", value: payments?.filter(p=>p.status==="successful").reduce((a,p)=>a+p.amount,0) || 0, icon: <CheckCircle2 className="h-5 w-5" />}, {label:"Pending", value: payments?.filter(p=>p.status==="pending").reduce((a,p)=>a+p.amount,0) || 0, icon: <Clock className="h-5 w-5" />}, {label:"Processing", value: payments?.filter(p=>p.status==="processing").reduce((a,p)=>a+p.amount,0) || 0, icon: <TrendingUp className="h-5 w-5" />}, {label:"Failed", value: payments?.filter(p=>p.status==="failed").reduce((a,p)=>a+p.amount,0) || 0, icon: <CreditCard className="h-5 w-5" />} ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">{s.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(s.value)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr><th className="px-4 py-3 font-medium">Reference</th><th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Method</th><th className="px-4 py-3 font-medium text-right">Date</th><th className="px-4 py-3 font-medium text-right">Invoice</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(payments || []).map((p) => (
              <tr key={p.id} className="hover:bg-muted/50">
                <td className="px-4 py-4">{p.bookingReference}</td>
                <td className="px-4 py-4">{formatCurrency(p.amount)}</td>
                <td className="px-4 py-4"><Badge variant={p.status === "successful" ? "success" : p.status === "pending" ? "warning" : "destructive"}>{p.status}</Badge></td>
                <td className="px-4 py-4 text-sm">{p.method || ""}</td>
                <td className="px-4 py-4 text-right">{p.createdAt.slice(0,10)}</td>
                <td className="px-4 py-4 text-right">{p.invoiceUrl ? <Link to={p.invoiceUrl} className="text-sm text-burgundy hover:underline">Download</Link> : <span className="text-xs text-muted-foreground"></span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8 p-6 rounded-xl border border-border bg-burgundy/5 text-burgundy/90">
        <p className="text-sm">Demo mode: Payments are simulated. Razorpay integration is prepared on the frontend  no real payment secrets are exposed and no real money moves until the backend is connected.</p>
      </div>
    </div>
  );
}


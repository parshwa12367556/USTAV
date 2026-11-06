
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle2, Clock } from "lucide-react";
import { formatCurrency } from "@/utils/format";

const payments = [
  { ref: "UTS-2025-0001", customer: "Sharma Family", amount: 70800, status: "successful", method: "UPI", date: "13 Nov 2025" },
  { ref: "UTS-2025-0001", customer: "Sharma Family", amount: 70800, status: "pending", method: "Bank Transfer", date: "20 Nov 2025" },
  { ref: "UTS-2025-0002", customer: "Sharma Family", amount: 45000, status: "successful", method: "UPI", date: "11 Nov 2025" },
];

export default function VendorPayments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Payments</h1>
        <p className="text-muted-foreground">Track payments received from families.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Received", value: payments.filter(p=>p.status==="successful").reduce((a,p)=>a+p.amount,0), icon: <CheckCircle2 className="h-5 w-5" /> },
          { label: "Pending", value: payments.filter(p=>p.status==="pending").reduce((a,p)=>a+p.amount,0), icon: <Clock className="h-5 w-5" /> },
          { label: "This Month", value: 115800, icon: <CreditCard className="h-5 w-5" /> },
          { label: "Payouts", value: 0, icon: <CreditCard className="h-5 w-5" /> },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">{s.icon}</div>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatCurrency(s.value)}</div></CardContent>
          </Card>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr><th className="px-4 py-3 font-medium">Reference</th><th className="px-4 py-3 font-medium">Customer</th><th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Method</th><th className="px-4 py-3 font-medium text-right">Date</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.map((p) => (
              <tr key={p.ref+p.date} className="hover:bg-muted/50">
                <td className="px-4 py-4">{p.ref}</td>
                <td className="px-4 py-4">{p.customer}</td>
                <td className="px-4 py-4">{formatCurrency(p.amount)}</td>
                <td className="px-4 py-4"><Badge variant={p.status==="successful"?"success":"warning"}>{p.status}</Badge></td>
                <td className="px-4 py-4 text-sm">{p.method}</td>
                <td className="px-4 py-4 text-right">{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8 p-6 rounded-xl border border-border bg-burgundy/5 text-burgundy/90">
        <p className="text-sm">Demo mode: Payments are simulated. Razorpay integration is prepared on the frontend  no real payment secrets exposed.</p>
      </div>
    </div>
  );
}


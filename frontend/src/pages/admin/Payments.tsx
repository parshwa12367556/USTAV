
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/format";

const payments = [
  { ref: "UTS-2025-0001", family: "Sharma Family", amount: 70800, status: "successful", method: "UPI", date: "13 Nov 2025" },
  { ref: "UTS-2025-0001", family: "Sharma Family", amount: 70800, status: "pending", method: "Bank Transfer", date: "20 Nov 2025" },
  { ref: "UTS-2025-0002", family: "Sharma Family", amount: 45000, status: "successful", method: "UPI", date: "11 Nov 2025" },
];

export default function AdminPayments() {
  const [q, setQ] = useState("");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-serif font-bold">Payments</h1>
        <Badge>{payments.length} transactions</Badge>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search payments" value={q} onChange={(e)=>setQ(e.target.value)} className="pl-10" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr><th className="px-4 py-3 font-medium">Reference</th><th className="px-4 py-3 font-medium">Family</th><th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium text-center">Status</th><th className="px-4 py-3 font-medium">Method</th><th className="px-4 py-3 font-medium text-right">Date</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.filter((p)=>p.ref.toLowerCase().includes(q.toLowerCase())).map((p) => (
              <tr key={p.ref+p.date} className="hover:bg-muted/50">
                <td className="px-4 py-4">{p.ref}</td>
                <td className="px-4 py-4">{p.family}</td>
                <td className="px-4 py-4">{formatCurrency(p.amount)}</td>
                <td className="px-4 py-4 text-center"><Badge variant={p.status==="successful"?"success":"warning"}>{p.status}</Badge></td>
                <td className="px-4 py-4">{p.method}</td>
                <td className="px-4 py-4 text-right">{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Calendar, CreditCard } from "lucide-react";
import { formatCurrency } from "@/utils/format";

export default function VendorAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Business Analytics</h1>
        <p className="text-muted-foreground">Track your enquiries, bookings and revenue.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Enquiries", value: "142", icon: <Users className="h-5 w-5" /> },
          { label: "Quotations Sent", value: "38", icon: <Calendar className="h-5 w-5" /> },
          { label: "Confirmed Bookings", value: "22", icon: <TrendingUp className="h-5 w-5" /> },
          { label: "Revenue", value: formatCurrency(425000), icon: <CreditCard className="h-5 w-5" /> },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader><CardTitle className="text-sm font-medium">{s.label}</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-foreground">{s.value}</div></CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg font-serif">Monthly Revenue Trend</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { month: "Aug", revenue: 120000 },
                { month: "Sep", revenue: 190000 },
                { month: "Oct", revenue: 150000 },
                { month: "Nov", revenue: 280000 },
                { month: "Dec", revenue: 210000 },
                { month: "Jan", revenue: 340000 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#7A2338" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileText, Users, Calendar, CreditCard } from "lucide-react";
import { formatCurrency } from "@/utils/format";

export default function AdminReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Reports</h1>
        <p className="text-muted-foreground">Platform activity and financial reports.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Revenue", value: formatCurrency(4250000), icon: <CreditCard className="h-5 w-5" /> },
          { label: "Total Bookings", value: "3,420", icon: <Calendar className="h-5 w-5" /> },
          { label: "Active Families", value: "8,900", icon: <Users className="h-5 w-5" /> },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="text-3xl font-bold text-foreground">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Monthly Bookings</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { month: "Aug", n: 340 },
                { month: "Sep", n: 410 },
                { month: "Oct", n: 380 },
                { month: "Nov", n: 520 },
                { month: "Dec", n: 460 },
                { month: "Jan", n: 610 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="n" fill="#7A2338" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



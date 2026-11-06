
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Calendar, CreditCard, Scale, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { adminService } from "@/services/admin.service";
import { formatCurrency } from "@/utils/format";

export default function AdminDashboard() {
  const { data: stats } = useQuery({ queryKey: ["adminStats"], queryFn: () => adminService.getStats() });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Platform Overview</h1>
        <p className="text-muted-foreground">Manage users, families, vendors and platform operations.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats?.totalUsers || 12450, icon: <Users className="h-5 w-5" /> },
          { label: "Total Families", value: stats?.totalFamilies || 8900, icon: <Building2 className="h-5 w-5" /> },
          { label: "Total Vendors", value: stats?.totalVendors || 1420, icon: <Building2 className="h-5 w-5" /> },
          { label: "Pending Verifications", value: stats?.pendingVerifications || 86, icon: <Clock className="h-5 w-5" /> },
          { label: "Total Bookings", value: stats?.totalBookings || 3420, icon: <Calendar className="h-5 w-5" /> },
          { label: "Platform Revenue", value: formatCurrency(stats?.platformRevenue || 4250000), icon: <CreditCard className="h-5 w-5" /> },
          { label: "Pending Disputes", value: stats?.pendingDisputes || 4, icon: <Scale className="h-5 w-5" /> },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">{s.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg font-serif">Vendor Growth</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { month: "Aug", vendors: 120 },
                  { month: "Sep", vendors: 180 },
                  { month: "Oct", vendors: 240 },
                  { month: "Nov", vendors: 310 },
                  { month: "Dec", vendors: 270 },
                  { month: "Jan", vendors: 420 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="vendors" fill="#7A2338" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg font-serif">Booking Trends</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { month: "Aug", bookings: 340 },
                  { month: "Sep", bookings: 410 },
                  { month: "Oct", bookings: 380 },
                  { month: "Nov", bookings: 520 },
                  { month: "Dec", bookings: 460 },
                  { month: "Jan", bookings: 610 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#C7A15A" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


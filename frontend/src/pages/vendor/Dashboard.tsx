
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, CreditCard, Calendar, Mail, Users, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/utils/format";

export default function VendorDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Vendor Dashboard</h1>
        <p className="text-muted-foreground">Manage your business, services and bookings.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Enquiries", value: "24", icon: <Mail className="h-5 w-5" /> },
          { label: "New Quotation Requests", value: "3", icon: <Clock className="h-5 w-5" /> },
          { label: "Pending Quotations", value: "2", icon: <Clock className="h-5 w-5" /> },
          { label: "Confirmed Bookings", value: "5", icon: <CheckCircle2 className="h-5 w-5" /> },
          { label: "Upcoming Events", value: "4", icon: <Calendar className="h-5 w-5" /> },
          { label: "Total Revenue", value: formatCurrency(425000), icon: <TrendingUp className="h-5 w-5" /> },
          { label: "Pending Payments", value: formatCurrency(85000), icon: <CreditCard className="h-5 w-5" /> },
          { label: "Profile Completion", value: "85%", icon: <Users className="h-5 w-5" /> },
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg font-serif">Recent Activities</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { who: "Sharma Family", what: "requested a quotation for Wedding venue", when: "2 hours ago" },
                { who: "Patel Family", what: "accepted your quotation", when: "5 hours ago" },
                { who: "Reddy Family", what: "sent a booking enquiry", when: "1 day ago" },
              ].map((a) => (
                <div key={a.who} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <div className="font-medium text-foreground">{a.who}</div>
                    <div className="text-sm text-muted-foreground">{a.what}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">{a.when}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg font-serif">Profile Completeness</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2"><span className="text-sm">Business profile</span><span className="text-sm font-medium">100%</span></div>
              <div className="w-full bg-muted rounded-full h-2"><div className="bg-burgundy h-2 rounded-full" style={{ width: "100%" }} /></div>
              <div className="flex items-center justify-between mb-2"><span className="text-sm">Services & packages</span><span className="text-sm font-medium">80%</span></div>
              <div className="w-full bg-muted rounded-full h-2"><div className="bg-gold h-2 rounded-full" style={{ width: "80%" }} /></div>
              <div className="flex items-center justify-between mb-2"><span className="text-sm">Portfolio images</span><span className="text-sm font-medium">60%</span></div>
              <div className="w-full bg-muted rounded-full h-2"><div className="bg-gold h-2 rounded-full" style={{ width: "60%" }} /></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


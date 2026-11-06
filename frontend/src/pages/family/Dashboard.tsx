
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Mail, CreditCard, Scale, Building2, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { formatCurrency } from "@/utils/format";
import { eventService } from "@/services/event.service";
import { guestService } from "@/services/guest.service";
import { bookingService } from "@/services/booking.service";
import { quotationService } from "@/services/quotation.service";
import { budgetService } from "@/services/budget.service";
import { rsvpService } from "@/services/rsvp.service";
import { mockRsvpStats } from "@/services/mock-data";

const statCards = [
  { title: "Total Events", value: "2", icon: <Calendar className="h-5 w-5" />, desc: "Active celebrations", to: "/family/events" },
  { title: "Upcoming Functions", value: "5", icon: <CheckCircle2 className="h-5 w-5" />, desc: "Across all events", to: "/family/events" },
  { title: "Invited Guests", value: "420", icon: <Users className="h-5 w-5" />, desc: "Total invitations sent", to: "/family/guests" },
  { title: "Confirmed RSVPs", value: "298", icon: <CheckCircle2 className="h-5 w-5" />, desc: "Guests attending", to: "/family/rsvp" },
  { title: "Pending RSVPs", value: "70", icon: <Clock className="h-5 w-5" />, desc: "Awaiting response", to: "/family/rsvp" },
  { title: "Confirmed Bookings", value: "2", icon: <Building2 className="h-5 w-5" />, desc: "Venues and services", to: "/family/bookings" },
  { title: "Pending Quotations", value: "1", icon: <Scale className="h-5 w-5" />, desc: "Awaiting your decision", to: "/family/quotations" },
  { title: "Amount Paid", value: formatCurrency(116799), icon: <CreditCard className="h-5 w-5" />, desc: "Against bookings", to: "/family/payments" },
  { title: "Remaining Balance", value: formatCurrency(967401), icon: <TrendingUp className="h-5 w-5" />, desc: "Estimated budget left", to: "/family/budget" },
];

export default function FamilyDashboard() {
  const { data: events } = useQuery({ queryKey: ["familyEvents"], queryFn: () => eventService.list() });
  const { data: stats } = useQuery({ queryKey: ["rsvpStats"], queryFn: () => rsvpService.stats("evt_001") });
  const { data: budget } = useQuery({ queryKey: ["budgetSummary"], queryFn: () => budgetService.summary("fam_001") });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Family Dashboard</h1>
          <p className="text-muted-foreground">Overview of your celebrations, bookings and budget.</p>
        </div>
        <Link to="/family/events/new" className="bg-burgundy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-deep-burgundy transition-colors">Create Event</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">{s.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </CardContent>
            <CardFooter>
              <Link to={s.to} className="text-xs font-medium text-burgundy hover:underline">View details ?</Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Upcoming Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(events || []).slice(0,2).flatMap((e) => e.functions.map((f) => (
                  <div key={f.id} className="flex items-center gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="text-right hidden md:block">
                      <div className="text-sm font-semibold text-foreground">{f.date}</div>
                      <div className="text-xs text-muted-foreground">{f.startTime}  {f.endTime}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">{f.name}</h4>
                        <Badge variant={f.status === "confirmed" ? "success" : "default"}>{f.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{f.venueName || "TBD"}  {f.guestCount} guests</p>
                    </div>
                    <span className="font-bold text-muted-foreground">?{f.spent.toLocaleString()} / ?{f.budget.toLocaleString()}</span>
                  </div>
                )))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">RSVP Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <PieChart width={300} height={250}>
                    <Pie data={[
                      { name: "Accepted", value: (stats || mockRsvpStats).accepted },
                      { name: "Pending", value: (stats || mockRsvpStats).pending },
                      { name: "Declined", value: (stats || mockRsvpStats).declined },
                      { name: "Maybe", value: (stats || mockRsvpStats).maybe },
                    ]} dataKey="value" cx="125" cy="125" innerRadius={60} outerRadius={90} fill="#888">
                      <Cell fill="#7A2338" />
                      <Cell fill="#EAE4E0" />
                      <Cell fill="#D9534F" />
                      <Cell fill="#D99A35" />
                    </Pie>
                  </PieChart>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Accepted", value: (stats || mockRsvpStats).accepted, color: "#21865B" },
                    { label: "Pending", value: (stats || mockRsvpStats).pending, color: "#D99A35" },
                    { label: "Declined", value: (stats || mockRsvpStats).declined, color: "#D9534F" },
                    { label: "Maybe", value: (stats || mockRsvpStats).maybe, color: "#C7A15A" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-semibold">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Budget Snapshot</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "Estimated", value: budget?.totalEstimated || 1200000 },
                  { label: "Actual", value: budget?.totalActual || 232599 },
                  { label: "Paid", value: budget?.totalPaid || 116799 },
                  { label: "Remaining", value: budget?.remainingBalance || 967401 },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-sm border-b border-border py-2 last:border-0">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(s.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Pending Actions</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">Review quotation from Royal Palace Banquet Hall</p>
                    <p className="text-xs text-muted-foreground">?1,41,600  Valid for 7 days</p>
                  </div>
                  <Link to="/family/quotations" className="text-sm font-medium text-burgundy">View ?</Link>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">70 guests have not responded</p>
                    <p className="text-xs text-muted-foreground">Send RSVP reminders</p>
                  </div>
                  <Link to="/family/rsvp" className="text-sm font-medium text-burgundy">Remind ?</Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}





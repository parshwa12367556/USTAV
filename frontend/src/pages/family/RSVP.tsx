
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, X, HelpCircle, Mail, Users } from "lucide-react";
import { rsvpService } from "@/services/rsvp.service";

export default function FamilyRSVP() {
  const { data: stats } = useQuery({ queryKey: ["rsvpStats"], queryFn: () => rsvpService.stats("evt_001") });
  const s = stats || { totalInvited: 0, accepted: 0, declined: 0, pending: 0, maybe: 0, expectedAttendees: 0, adultCount: 0, childCount: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">RSVP Management</h1>
          <p className="text-muted-foreground">Track responses function by function.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Send Reminders</Button>
          <Button className="bg-burgundy text-white">Export RSVP Sheet</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Invited", value: s.totalInvited, icon: <Users className="h-5 w-5" /> },
          { label: "Accepted", value: s.accepted, icon: <CheckCircle2 className="h-5 w-5" /> },
          { label: "Declined", value: s.declined, icon: <X className="h-5 w-5" /> },
          { label: "Pending", value: s.pending, icon: <Clock className="h-5 w-5" /> },
        ].map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">{c.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{c.value}</div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Attendees</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold">{<Users className="h-5 w-5" />}</div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{s.expectedAttendees}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.adultCount} adults  {s.childCount} children</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg font-serif">Response Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { fn: "Engagement", accepted: 230, pending: 15, declined: 5 },
                  { fn: "Haldi", accepted: 105, pending: 10, declined: 5 },
                  { fn: "Mehendi", accepted: 150, pending: 25, declined: 5 },
                  { fn: "Wedding", accepted: 290, pending: 60, declined: 50 },
                  { fn: "Reception", accepted: 340, pending: 70, declined: 10 },
                ].map((f) => (
                  <div key={f.fn} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <div className="font-medium text-foreground">{f.fn}</div>
                      <div className="text-xs text-muted-foreground">Function-wise RSVP</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-success">? {f.accepted}</span>
                      <span className="text-xs text-warning">? {f.pending}</span>
                      <span className="text-xs text-destructive">? {f.declined}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-5">
              <h4 className="font-semibold mb-4">How it works</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3"><Mail className="h-4 w-4 shrink-0 mt-0.5" /><p className="text-sm text-muted-foreground">Each guest receives a personalised invitation link via WhatsApp or email.</p></div>
                <div className="flex items-start gap-3"><HelpCircle className="h-4 w-4 shrink-0 mt-0.5" /><p className="text-sm text-muted-foreground">Guests respond to each function separately  they can accept the wedding but decline the reception.</p></div>
                <div className="flex items-start gap-3"><Users className="h-4 w-4 shrink-0 mt-0.5" /><p className="text-sm text-muted-foreground">RSVPs update in real time on your family dashboard.</p></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, ArrowRight, Edit3, Plus, Share2 } from "lucide-react";
import { eventService } from "@/services/event.service";
import { formatDate, formatCurrency } from "@/utils/format";

export default function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventService.get(eventId || ""),
    enabled: !!eventId,
  });

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">Loading event</div>;
  if (!event) return <div className="p-10 text-center text-muted-foreground">Event not found.</div>;

  const totalSpent = event.functions.reduce((a, f) => a + f.spent, 0);
  const totalBudget = event.functions.reduce((a, f) => a + f.budget, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">{event.name}</h1>
          <p className="text-muted-foreground">{event.city}  {event.type.replace("_"," ")}  {formatDate(event.startDate)} to {formatDate(event.endDate)}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/family/events" className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">Back</Link>
          <Button className="flex items-center gap-2"><Share2 className="h-4 w-4" /> Share</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg font-serif">Functions</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">{event.functions.length} functions</span>
                <Link to={"/family/events/" + event.id + "/functions"} className="text-xs font-medium text-burgundy hover:underline">Manage functions ?</Link>
              </div>
              <div className="space-y-3">
                {event.functions.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold font-medium">{f.date.slice(5)}</div>
                      <div>
                        <div className="font-semibold text-foreground">{f.name}</div>
                        <div className="text-xs text-muted-foreground">{f.date}  {f.startTime}{f.endTime}  {f.guestCount} guests</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">?{f.spent.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">of ?{f.budget.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg font-serif">Event Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Overall completion</span>
                  <span className="text-sm font-medium">{Math.round((totalSpent / Math.max(totalBudget,1)) * 100)}% spent</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5"><div className="bg-burgundy h-2.5 rounded-full" style={{ width: Math.min((totalSpent / Math.max(totalBudget,1)) * 100, 100) + "%" }} /></div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Spent: {formatCurrency(totalSpent)}</span>
                  <span>Budget: {formatCurrency(totalBudget)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button onClick={() => navigate("/family/events/" + event.id + "/functions")} className="w-full justify-start gap-2 text-left"><Plus className="h-4 w-4" /> Add Function</Button>
                <Link to="/family/invitations" className="w-full py-2.5 text-center text-sm font-semibold text-burgundy border border-border rounded-lg block">Create Invitation</Link>
                <Link to="/family/guests" className="w-full py-2.5 text-center text-sm font-semibold text-burgundy border border-border rounded-lg block">Manage Guests</Link>
                <Link to="/family/rsvp" className="w-full py-2.5 text-center text-sm font-semibold text-burgundy border border-border rounded-lg block">Track RSVPs</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


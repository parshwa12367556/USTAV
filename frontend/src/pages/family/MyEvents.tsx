
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Trash2, Edit3, Plus } from "lucide-react";
import { eventService } from "@/services/event.service";
import { formatDate, formatCurrency } from "@/utils/format";

export default function MyEvents() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [view, setView] = useState<"grid" | "list">("grid");
  const { data: events, isLoading } = useQuery({ queryKey: ["familyEvents"], queryFn: () => eventService.list() });

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    try {
      await eventService.remove(id);
      toast({ title: "Deleted", description: "Event removed successfully." });
      navigate(0, { overwrite: true });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Could not delete event", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">My Events</h1>
          <p className="text-muted-foreground">Manage all your celebrations and wedding functions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "grid" ? "secondary" : "outline"} size="sm" onClick={() => setView("grid")}><Plus className="h-3 w-3" /></Button>
          <Button variant={view === "list" ? "secondary" : "outline"} size="sm" onClick={() => setView("list")} />
        </div>
        <Link to="/family/events/new" className="bg-burgundy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-deep-burgundy transition-colors flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create Event
        </Link>
      </div>

      {isLoading ? (
        <div className="h-80 flex items-center justify-center text-muted-foreground">Loading events</div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(events || []).map((e) => (
            <Card key={e.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 relative overflow-hidden">
                <img src={e.coverImage || "https://images.unsplash.com/photo-1519741497674-611481863552"} alt={e.name} className="w-full h-full object-cover" />
              </div>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{e.name}</h3>
                  <Badge variant={e.status === "confirmed" ? "success" : "default"}>{e.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{e.city}  {e.type.replace("_"," ")}</p>
                <p className="text-sm text-muted-foreground mt-2">{formatDate(e.startDate)} ? {formatDate(e.endDate)}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> {e.functions.reduce((a,f)=>a+f.guestCount,0)} total guests
                </div>
              </CardContent>
              <CardFooter className="pt-4 gap-2">
                <Link to={"/family/events/" + e.id} className="flex-1 py-2 text-center text-sm font-semibold text-burgundy border border-border rounded-lg">View</Link>
                <Button size="sm" className="flex-1" onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id); }}><Trash2 className="h-3 w-3" /></Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-muted">
              <tr><th className="px-4 py-3 font-medium">Event</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Dates</th><th className="px-4 py-3 font-medium">Functions</th><th className="px-4 py-3 font-medium text-right">Budget</th><th className="px-4 py-3 font-medium text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(events || []).map((e) => (
                <tr key={e.id} className="hover:bg-muted/50">
                  <td className="px-4 py-4"><Link to={"/family/events/" + e.id} className="font-semibold text-foreground hover:underline">{e.name}</Link></td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{e.type.replace("_"," ")}</td>
                  <td className="px-4 py-4 text-sm">{formatDate(e.startDate)} ? {formatDate(e.endDate)}</td>
                  <td className="px-4 py-4 text-sm">{e.functions.length}</td>
                  <td className="px-4 py-4 text-sm text-right font-medium">{formatCurrency(e.totalBudget)}</td>
                  <td className="px-4 py-4 text-right">
                    <Button size="sm" variant="outline" onClick={(ev)=>{ev.stopPropagation(); handleDelete(e.id);}}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(events || []).length === 0 && <div className="p-10 text-center text-muted-foreground">No events yet. Create your first event to get started.</div>}
        </div>
      )}
    </div>
  );
}


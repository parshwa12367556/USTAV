
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Plus, Trash2, Edit3 } from "lucide-react";
import { guestService } from "@/services/guest.service";
import { formatCurrency } from "@/utils/format";

export default function FamilyGuests() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const { data: guests, isLoading } = useQuery({ queryKey: ["familyGuests", "fam_001"], queryFn: () => guestService.list("fam_001") });
  const filtered = (guests || []).filter((g) => g.name.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || g.rsvpStatus === filter));
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Guest Management</h1>
          <p className="text-muted-foreground">Manage your guest list, groups and RSVPs.</p>
        </div>
        <div className="flex gap-2">
          <Link to="#" className="px-4 py-2 text-sm text-muted-foreground hover:underline">Import CSV</Link>
          <Link to="#" className="px-4 py-2 text-sm text-muted-foreground hover:underline">Export CSV</Link>
          <Button className="bg-burgundy text-white flex items-center gap-2"><Plus className="h-4 w-4" /> Add Guest</Button>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search guests by name or mobile" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          {["all","pending","accepted","declined","maybe"].map((v) => <Button key={v} variant={filter === v ? "secondary" : "outline"} size="sm" onClick={() => setFilter(v)}>{v}</Button>)}
        </div>
      </div>
      {isLoading ? <div className="h-80 flex items-center justify-center text-muted-foreground">Loading guests</div> : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr><th>Guest</th><th>Mobile</th><th>Group</th><th>RSVP</th><th className="text-right">Attendees</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((g) => (
                <tr key={g.id} className="hover:bg-muted/50">
                  <td>{g.name} <span className="text-xs text-muted-foreground block">{g.email || "no email"}</span></td>
                  <td>{g.mobile}</td>
                  <td><span className="text-xs font-medium px-2 py-1 rounded-full bg-muted">{g.groupName}</span></td>
                  <td><Badge variant={g.rsvpStatus === "accepted" ? "success" : g.rsvpStatus === "declined" ? "destructive" : "default"}>{g.rsvpStatus}</Badge></td>
                  <td className="text-right">{g.attendingCount}</td>
                  <td className="text-right"><div className="flex gap-1"><Button size="sm" variant="outline"><Edit3 className="h-3 w-3" /></Button><Button size="sm" variant="destructive"><Trash2 className="h-3 w-3" /></Button></div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No guests found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[{label:"Total Invited", value:(guests||[]).length},{label:"Accepted", value:(guests||[]).filter(g=>g.rsvpStatus==="accepted").length},{label:"Pending", value:(guests||[]).filter(g=>g.rsvpStatus==="pending").length},{label:"Declined", value:(guests||[]).filter(g=>g.rsvpStatus==="declined").length}].map((s) => <Card key={s.label}><CardContent className="p-4"><div className="text-2xl font-bold">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></CardContent></Card>)}
      </div>
    </div>
  );
}


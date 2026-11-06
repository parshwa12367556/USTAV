
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const users = [
  { id: "u1", name: "Rajesh Sharma", email: "rajesh@example.com", mobile: "+91 98765 43210", role: "family", city: "Delhi", joined: "2025-06-12" },
  { id: "u2", name: "Amit Singh", email: "amit@royalbanquet.in", mobile: "+91 91234 56780", role: "vendor", city: "Mumbai", joined: "2025-07-01" },
  { id: "u3", name: "Priya Mehra", email: "priya@example.com", mobile: "+91 98111 44441", role: "family", city: "Delhi", joined: "2025-08-15" },
];

export default function AdminUsers() {
  const [q, setQ] = useState("");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-serif font-bold">Users</h1>
        <Badge>{users.length} total</Badge>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users" value={q} onChange={(e)=>setQ(e.target.value)} className="pl-10" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">City</th><th className="px-4 py-3 font-medium text-right">Joined</th><th className="px-4 py-3 font-medium text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.filter((u)=>u.name.toLowerCase().includes(q.toLowerCase())).map((u) => (
              <tr key={u.id} className="hover:bg-muted/50">
                <td className="px-4 py-4"><div className="font-medium text-foreground">{u.name}</div></td>
                <td className="px-4 py-4">{u.email}</td>
                <td className="px-4 py-4"><Badge variant="outline">{u.role}</Badge></td>
                <td className="px-4 py-4">{u.city}</td>
                <td className="px-4 py-4 text-right">{u.joined}</td>
                <td className="px-4 py-4 text-right"><Button size="sm" variant="outline">View</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


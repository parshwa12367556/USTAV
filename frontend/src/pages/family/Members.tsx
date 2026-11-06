
import { Card, CardContent } from "@/components/ui/card";
import { FAMILY_MEMBER_ROLES } from "@/constants";
import { Shield, Users, User } from "lucide-react";

export default function FamilyMembers() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Family Members</h1>
        <p className="text-muted-foreground">Manage your family workspace and member roles.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4">Family Members</h3>
              <div className="space-y-4">
                {[
                  { name: "Rajesh Sharma", role: "owner", mobile: "+91 98765 43210", email: "rajesh@example.com" },
                  { name: "Sunita Sharma", role: "administrator", mobile: "+91 98765 43211", email: "sunita@example.com" },
                  { name: "Karan Sharma", role: "event_coordinator", mobile: "+91 98765 43212", email: "karan@example.com" },
                ].map((m) => (
                  <div key={m.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">{m.name.split(" ").map((n)=>n[0]).join("")}</div>
                      <div>
                        <div className="font-medium text-foreground">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.mobile}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-burgundy">{m.role.replace("_"," ")}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4">Member Roles</h3>
              <p className="text-sm text-muted-foreground mb-4">Assign permissions to family members involved in planning.</p>
              <div className="space-y-3">
                {FAMILY_MEMBER_ROLES.map((r) => (
                  <div key={r.value} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50">
                    <div>
                      <div className="font-medium text-foreground">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.value}</div>
                    </div>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Clock, Mail, Scale, CreditCard, Users } from "lucide-react";
import { notificationService } from "@/services/notification.service";

const types = [
  { label: "RSVP Updates", icon: <Users className="h-4 w-4" /> },
  { label: "New Quotation", icon: <Scale className="h-4 w-4" /> },
  { label: "Quotation Accepted", icon: <Mail className="h-4 w-4" /> },
  { label: "Booking Confirmed", icon: <Clock className="h-4 w-4" /> },
  { label: "Payment Updates", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Vendor Messages", icon: <Mail className="h-4 w-4" /> },
  { label: "Event Reminders", icon: <Bell className="h-4 w-4" /> },
  { label: "Invitation Activity", icon: <Users className="h-4 w-4" /> },
];

export default function FamilyNotifications() {
  const { data: notifications } = useQuery({ queryKey: ["familyNotifications", "usr_101"], queryFn: () => notificationService.list("usr_101") });
  const unread = (notifications || []).filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-serif font-bold">Notifications</h1>
        <Badge variant={unread > 0 ? "default" : "outline"}>{unread} unread</Badge>
      </div>
      <div className="flex gap-2 mb-6">
        {types.map((t) => (
          <Button key={t.label} variant="outline" size="sm">{t.icon} {t.label}</Button>
        ))}
        <Button variant="outline" size="sm" className="ml-auto">Mark all as read</Button>
      </div>
      <div className="space-y-4">
        {(notifications || []).map((n) => (
          <Card key={n.id} className={n.read ? "" : "bg-gold/5 border-gold/20"}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-burgundy shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.message}</div>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-muted-foreground">{n.createdAt.slice(0,10)}</div>
                  {!n.read && <span className="text-xs font-medium text-burgundy">Unread</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(notifications || []).length === 0 && <div className="p-8 text-center text-muted-foreground">No notifications yet.</div>}
      </div>
    </div>
  );
}


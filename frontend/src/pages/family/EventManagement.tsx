
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, Users, Building2, Truck, Users as Users2, Film, Music } from "lucide-react";
import { vendorService } from "@/services/vendor.service";

const services = [
  { title: "Complete Event Management", desc: "End-to-end planning and execution.", icon: <Calendar className="h-5 w-5" />, cat: "event_management" },
  { title: "Event Coordination", desc: "On-the-day coordination and timeline management.", icon: <Users className="h-5 w-5" />, cat: "event_management" },
  { title: "Guest Management", desc: "RSVPs, seating and guest communications.", icon: <Users2 className="h-5 w-5" />, cat: "event_management" },
  { title: "Vendor Coordination", desc: "Liaising with all your booked vendors.", icon: <Building2 className="h-5 w-5" />, cat: "event_management" },
  { title: "Stage Management", desc: "Stage setup, cue and programme flow.", icon: <Film className="h-5 w-5" />, cat: "event_management" },
  { title: "Transportation Coordination", desc: "Guest and wedding party transport.", icon: <Truck className="h-5 w-5" />, cat: "event_management" },
];

export default function FamilyEventManagement() {
  const { data: vendors } = useQuery({ queryKey: ["famEventVendors"], queryFn: () => vendorService.list() });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Event Management Services</h1>
        <p className="text-muted-foreground">Professional coordinators to run your celebration smoothly.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s) => (
          <Card key={s.title}>
            <CardContent className="pt-6 pb-4">
              <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center text-gold mb-4">{s.icon}</div>
              <h3 className="font-semibold text-foreground">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </CardContent>
            <CardFooter>
              <Link to={"/family/vendors"} className="w-full py-2 text-center text-sm font-semibold text-burgundy border border-border rounded-lg">Find Providers</Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="mt-8">
        <h3 className="font-semibold mb-4">Available Event Management Companies</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(vendors || []).filter((v) => v.category === "event_management").map((v) => (
            <Card key={v.id}>
              <CardContent className="pt-5 pb-4">
                <h3 className="font-semibold text-foreground">{v.businessName}</h3>
                <p className="text-sm text-muted-foreground">{v.city}</p>
              </CardContent>
              <CardFooter>
                <Link to={"/family/vendors"} className="w-full py-2 text-center text-sm font-semibold text-burgundy border border-border rounded-lg">Contact</Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}


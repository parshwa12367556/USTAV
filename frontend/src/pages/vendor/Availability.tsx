
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function VendorAvailability() {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState("");
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Availability</h1>
        <p className="text-muted-foreground">Manage when your venue or services are available for booking.</p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-5">
          <form className="space-y-4">
            <div className="space-y-2"><div className="text-sm font-medium text-foreground">Date</div><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-2"><div className="text-sm font-medium text-foreground">Available time slots</div><Input placeholder="e.g. 10:00 AM - 6:00 PM" value={slots} onChange={(e) => setSlots(e.target.value)} /></div>
            <div className="space-y-2"><div className="text-sm font-medium text-foreground">Notes</div><textarea rows="3" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="e.g. Not available on weekends" /></textarea></div>
            <Button type="button" className="w-full bg-burgundy text-white">Update Availability</Button>
          </form>
        </CardContent>
      </Card>
      <div className="p-6 rounded-xl border border-border bg-muted/50 text-center text-muted-foreground">
        <Calendar className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Availability calendar will display your open dates here.</p>
      </div>
    </div>
  );
}



import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventSchema, type CreateEventInput } from "@/schemas";
import { eventService } from "@/services/event.service";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EVENT_TYPES } from "@/constants";
import { Plus } from "lucide-react";

export default function CreateEvent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<CreateEventInput>({ resolver: zodResolver(createEventSchema), defaultValues: { startDate: "", endDate: "", totalBudget: 0 } });
  const type = watch("type");
  const showBudget = type === "wedding";
  const onSubmit = async (data: CreateEventInput) => {
    setLoading(true);
    try { const ev = await eventService.create(data); toast({ title: "Event created", description: ev.name + " has been added." }); navigate("/family/events/" + ev.id); }
    catch (e: any) { toast({ title: "Error", description: e.message || "Could not create event", variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-10 space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Create Event</h1>
        <p className="text-muted-foreground">Add your celebration and its details.</p>
      </div>
      <Link to="/family/events" className="px-4 py-2 text-sm text-muted-foreground hover:underline">Back to events</Link>
      <Card>
        <CardHeader><CardTitle className="text-lg font-serif font-bold">Event Details</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="name">Event name</Label><Input id="name" placeholder="e.g. Aanya and Vihaan Wedding" {...register("name")} /><p className="text-xs text-destructive">{errors.name?.message}</p></div>
              <div className="space-y-2"><Label>Event type</Label><Select onValueChange={(v) => { setValue("type", v); }} value={type} {...register("type")}><option value="">Select type</option>{EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select><p className="text-xs text-destructive">{errors.type?.message}</p></div>
            </div>
            <div className="space-y-2"><Label htmlFor="description">Description</Label><textarea id="description" rows="3" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring" {...register("description")} /><p className="text-xs text-destructive">{errors.description?.message}</p></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="startDate">Start date</Label><Input id="startDate" type="date" {...register("startDate")} /><p className="text-xs text-destructive">{errors.startDate?.message}</p></div>
              <div className="space-y-2"><Label htmlFor="endDate">End date</Label><Input id="endDate" type="date" {...register("endDate")} /><p className="text-xs text-destructive">{errors.endDate?.message}</p></div>
            </div>
            <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" placeholder="Delhi" {...register("city")} /></div>
            {showBudget && <div className="space-y-2"><Label htmlFor="totalBudget">Total budget</Label><Input id="totalBudget" type="number" placeholder="e.g. 1200000" {...register("totalBudget")} /><p className="text-xs text-destructive">{errors.totalBudget?.message}</p></div>}
            <Button type="submit" disabled={loading} className="w-full bg-burgundy text-white"><Plus className="h-4 w-4 mr-2" /> {loading ? "Creating" : "Create Event"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


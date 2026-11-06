
import { useParams } from "react-router-dom";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFunctionSchema, type CreateFunctionInput } from "@/schemas";
import { eventService } from "@/services/event.service";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select as SelectSmall } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FUNCTION_TYPES } from "@/constants";
import { Plus, ArrowLeft } from "lucide-react";

export default function Functions() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<CreateFunctionInput>({ resolver: zodResolver(createFunctionSchema), defaultValues: { eventId: eventId || "", guestCount: 1, budget: 0 } });
  const type = watch("type");
  const isWedding = type === "wedding";
  const onSubmit = async (data: CreateFunctionInput) => { try { await eventService.createFunction(data); toast({ title: "Function added", description: data.name + " created successfully." }); reset(); setOpen(false); } catch (e: any) { toast({ title: "Error", description: e.message || "Could not create function", variant: "destructive" }); } };
  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/family/events/" + eventId)}><ArrowLeft className="h-3 w-3 mr-2" /> Back to event</Button>
        <h1 className="text-2xl font-serif font-bold">Functions</h1>
      </div>
      <Button onClick={() => setOpen(true)} className="bg-burgundy text-white flex items-center gap-2"><Plus className="h-4 w-4" /> Add Function</Button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: "Engagement", date: "14 Feb 2026", time: "17:00-20:00", venue: "Royal Palace Banquet", guests: 250, spent: 280000, budget: 300000, status: "confirmed" },
          { name: "Haldi Ceremony", date: "15 Feb 2026", time: "09:00-12:00", venue: "Family Home", guests: 120, spent: 65000, budget: 80000, status: "confirmed" },
          { name: "Mehendi", date: "15 Feb 2026", time: "15:00-19:00", venue: "Family Home", guests: 180, spent: 110000, budget: 120000, status: "confirmed" },
          { name: "Wedding", date: "16 Feb 2026", time: "10:00-13:00", venue: "Grand Mandap Hall", guests: 500, spent: 420000, budget: 500000, status: "planned" },
          { name: "Reception", date: "16 Feb 2026", time: "19:00-23:00", venue: "Grand Mandap Hall", guests: 600, spent: 0, budget: 200000, status: "planned" },
        ].map((f) => <Card key={f.name} className="overflow-hidden"><CardContent className="pt-5 pb-4"><div className="flex items-center justify-between mb-2"><h3 className="font-semibold text-foreground">{f.name}</h3><Badge variant={f.status === "confirmed" ? "success" : "default"}>{f.status}</Badge></div><p className="text-sm text-muted-foreground">{f.date} | {f.time}</p><p className="text-sm text-muted-foreground">{f.venue} | {f.guests} guests</p ></CardContent><CardFooter className="pt-4"><div className="text-right"><div className="font-bold text-foreground">Rs.{f.spent}</div><div className="text-xs text-muted-foreground">of Rs.{f.budget}</div></div></CardFooter></Card>)}
      </div>
      {open && <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}><Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}><CardHeader><CardTitle className="text-lg font-serif">Add Function</CardTitle></CardHeader><CardContent className="space-y-4 pt-0"><form onSubmit={handleSubmit(onSubmit)} className="space-y-4"><div className="space-y-2"><Label htmlFor="fnName">Function name</Label><Input id="fnName" placeholder="e.g. Mehendi" {...register("name")} /><p className="text-xs text-destructive">{errors.name?.message}</p></div><div className="space-y-2"><Label>Function type</Label><Select value={type} onValueChange={(v) => { setValue("type", v); }} {...register("type")}><option value="">Select type</option>{FUNCTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select><p className="text-xs text-destructive">{errors.type?.message}</p></div>
        <div className="grid md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="fnDate">Date</Label><Input id="fnDate" type="date" {...register("date")} /></div><div className="space-y-2"><Label htmlFor="fnTime">Time</Label><div className="flex gap-2"><Input id="fnStart" type="time" /><Input id="fnEnd" type="time" /></div></div></div>
        <div className="space-y-2"><Label htmlFor="fnGuests">Guest count</Label><Input id="fnGuests" type="number" {...register("guestCount")} /></div>
        <div className="space-y-2"><Label htmlFor="fnBudget">Budget</Label><Input id="fnBudget" type="number" {...register("budget")} /></div>
        <Button type="submit" className="w-full bg-burgundy text-white">Add Function</Button></form></CardContent></Card></Card>)}
    </div>
  );
}



import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invitationConfigSchema, type InvitationConfigInput } from "@/schemas";
import { invitationService } from "@/services/invitation.service";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Phone, MapPin, Calendar, Clock, Image as ImageIcon, Palette, FontSizes, Layout, Save, Play, Mobile } from "lucide-react";

const FONTS = ["Playfair Display", "Inter", "Cormorant Garamond", "Montserrat"];
const THEMES = ["#7A2338", "#541729", "#C7A15A", "#21865B", "#282326"];

const defaultConfig: InvitationConfigInput = {
  brideName: "Aanya", groomName: "Vihaan", hostNames: ["Sharma Family"], eventTitle: "Aanya and Vihaan",
  functionName: "Wedding", date: "2026-02-16", time: "10:00 AM", venue: "Grand Mandap Hall",
  address: "Connaught Place, New Delhi", message: "We cordially invite you to bless us on our special day.",
  themeColor: "#7A2338", font: "Playfair Display", textAlignment: "center",
};

export default function InvitationEditor() {
  const { invitationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [view, setView] = useState<"desktop" | "mobile">("desktop");
  const {
    register, handleSubmit, watch, setValue, formState: { errors },
  } = useForm<InvitationConfigInput>({ resolver: zodResolver(invitationConfigSchema), defaultValues: defaultConfig });

  const config = watch();
  const onSubmit = async (data: InvitationConfigInput) => {
    try {
      await invitationService.save(data);
      toast({ title: "Saved", description: "Invitation draft saved successfully." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Could not save", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-full lg:w-96 border-r border-border bg-card flex flex-col overflow-y-auto">
        <div className="p-5 flex items-center justify-between border-b border-border">
          <h2 className="text-lg font-serif font-bold">Invitation Editor</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onSubmit(config as InvitationConfigInput)}><Save className="h-3 w-3" /> Save Draft</Button>
            <Button size="sm" className="bg-burgundy text-white">Publish</Button>
          </div>
        </div>
        <div className="p-5 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="brideName">Bride name</Label>
              <Input id="brideName" {...register("brideName")} />
              {errors.brideName && <p className="text-xs text-destructive">{errors.brideName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="groomName">Groom name</Label>
              <Input id="groomName" {...register("groomName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostNames">Host family names</Label>
              <Input id="hostNames" placeholder="e.g. Sharma and Verma Families" {...register("hostNames")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventTitle">Event title</Label>
              <Input id="eventTitle" {...register("eventTitle")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="functionName">Function name</Label>
              <Input id="functionName" {...register("functionName")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="date">Date</Label><Input id="date" type="date" {...register("date")} /></div>
              <div className="space-y-2"><Label htmlFor="time">Time</Label><Input id="time" {...register("time")} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="venue">Venue</Label><Input id="venue" {...register("venue")} /></div>
            <div className="space-y-2"><Label htmlFor="address">Address</Label><Input id="address" {...register("address")} /></div>
            <div className="space-y-2">
              <Label htmlFor="message">Invitation message</Label>
              <textarea id="message" rows="4" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring" {...register("message")} />
            </div>
            <div className="space-y-2">
              <Label>Theme color</Label>
              <div className="flex gap-2">
                {THEMES.map((c) => (
                  <button key={c} type="button" onClick={() => setValue("themeColor", c)} className="w-8 h-8 rounded-full border" />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Font</Label>
              <Select value={config.font} onValueChange={(v) => setValue("font", v)} {...register("font")}>
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Text alignment</Label>
              <div className="flex gap-2">
                {["left","center","right"].map((a) => (
                  <button key={a} type="button" onClick={() => setValue("textAlignment", a as any)} className="w-8 h-8 rounded-md border flex items-center justify-center text-sm font-medium">{a.charAt(0)}</button>
                ))}
              </div>
            </div>
          </form>
        </div>
      </aside>

      <main className="flex-1 relative flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setView("desktop")}>Desktop</Button>
            <Button variant="outline" size="sm" onClick={() => setView("mobile")}><Mobile className="h-3 w-3" /> Mobile</Button>
          </div>
          <Link to="/family/invitations" className="text-sm text-muted-foreground hover:underline">Back to invitations</Link>
        </div>
        <div className="flex-1 flex items-center justify-center overflow-auto bg-muted/30 p-6">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-border p-8 text-center">
            <div className="text-center">
              <div className="text-xs font-semibold tracking-wider text-burgundy/60 mb-2">You are Invited</div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">{config.eventTitle}</h1>
              <p className="text-lg text-foreground mt-2">{config.brideName} + {config.groomName}</p>
              <p className="text-muted-foreground mt-4">{config.functionName} Wedding</p>
              <div className="mt-6 space-y-1 text-sm">
                <p><span className="font-semibold">{config.date}</span> {config.time}</p>
                <p>{config.venue}</p>
                <p>{config.address}</p>
              </div>
              <p className="mt-6 italic text-muted-foreground">{config.message}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { rsvpFormSchema } from "@/schemas";
import { rsvpService } from "@/services/rsvp.service";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Users, Mail } from "lucide-react";

export default function GuestRSVPForm() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const {
    register, handleSubmit, formState: { errors },
  } = useForm<{ status: string; attendingCount: number; adultCount: number; childCount: number; dietaryPreferences?: string }>({
    resolver: zodResolver(rsvpFormSchema),
    defaultValues: { status: "accepted", attendingCount: 1, adultCount: 1, childCount: 0 },
  });

  const onSubmit = async (data: any) => {
    try {
      await rsvpService.submit({ invitationId: token || "demo", functionId: "fn_004", status: data.status, attendingCount: data.attendingCount, adultCount: data.adultCount, childCount: data.childCount, dietaryPreferences: data.dietaryPreferences });
      setSubmitted(true);
    } catch (e: any) {
      toast({ title: "RSVP failed", description: e.message || "Could not submit RSVP", variant: "destructive" });
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto py-10 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center text-success mx-auto mb-4"><CheckCircle2 className="h-8 w-8" /></div>
        <CardTitle className="text-2xl font-serif font-bold">Thank you!</CardTitle>
        <p className="text-muted-foreground mt-2">Your RSVP has been recorded. We look forward to celebrating with you.</p>
        <Link to={"/invite/" + (token || "demo")} className="mt-6 inline-block text-sm font-medium text-burgundy hover:underline">Back to invitation</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-serif font-bold">RSVP</CardTitle>
          <p className="text-muted-foreground">Please let us know if you can join the celebration.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label>Will you attend?</Label>
              <div className="flex gap-3">
                {["accepted","declined","maybe"].map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer rounded-lg border p-3 text-sm">
                    <input type="radio" value={s} {...register("status")} className="text-burgundy" />
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </label>
                ))}
              </div>
              {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendingCount">Number of people attending</Label>
              <Input id="attendingCount" type="number" min="1" {...register("attendingCount")} />
              {errors.attendingCount && <p className="text-xs text-destructive">{errors.attendingCount.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="adultCount">Adults</Label><Input id="adultCount" type="number" min="0" {...register("adultCount")} /></div>
              <div className="space-y-2"><Label htmlFor="childCount">Children</Label><Input id="childCount" type="number" min="0" {...register("childCount")} /></div>
            </div>
            {errors.childCount && <p className="text-xs text-destructive">{errors.childCount.message}</p>}
            <div className="space-y-2">
              <Label htmlFor="dietaryPreferences">Dietary preferences (optional)</Label>
              <Input id="dietaryPreferences" placeholder="e.g. Vegetarian, No onions" {...register("dietaryPreferences")} />
            </div>
            <Button type="submit" className="w-full bg-burgundy text-white">Submit RSVP</Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Responding on behalf of your family? You can update your response later using the same link.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


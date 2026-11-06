
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

const settingsSchema = z.object({
  fullName: z.string().min(2, "Required"),
  email: z.string().email("Invalid email"),
  mobile: z.string().min(10, "Invalid mobile"),
  city: z.string().min(2, "Required"),
});

export default function FamilySettings() {
  const { toast } = useToast();
  const {
    register, handleSubmit, formState: { errors },
  } = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { fullName: "Rajesh Sharma", email: "rajesh.sharma@example.com", mobile: "+91 98765 43210", city: "Delhi" },
  });

  const onSubmit = async (data: any) => {
    try {
      toast({ title: "Saved", description: "Your settings have been updated." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Could not save", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-serif font-bold">Settings</h1>
      <Card>
        <CardHeader><CardTitle className="text-lg font-serif">Account Settings</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="fullName">Full name</Label><Input id="fullName" {...register("fullName")} /><p className="text-xs text-destructive">{errors.fullName?.message}</p></div>
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" {...register("email")} /><p className="text-xs text-destructive">{errors.email?.message}</p></div>
            </div>
            <div className="space-y-2"><Label htmlFor="mobile">Mobile number</Label><Input id="mobile" {...register("mobile")} /><p className="text-xs text-destructive">{errors.mobile?.message}</p></div>
            <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" {...register("city")} /><p className="text-xs text-destructive">{errors.city?.message}</p></div>
            <Button type="submit" className="w-full bg-burgundy text-white">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Notification Preferences</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between"><span className="text-sm">RSVP updates</span><input type="checkbox" className="rounded border-input" defaultChecked /></label>
            <label className="flex items-center justify-between"><span className="text-sm">Payment reminders</span><input type="checkbox" className="rounded border-input" defaultChecked /></label>
            <label className="flex items-center justify-between"><span className="text-sm">Vendor messages</span><input type="checkbox" className="rounded border-input" /></label>
            <label className="flex items-center justify-between"><span className="text-sm">Event reminders</span><input type="checkbox" className="rounded border-input" defaultChecked /></label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VENDOR_CATEGORIES } from "@/constants";
import { useToast } from "@/components/ui/toast";
import { Building2, Phone, Mail, MapPin, Clock, ShieldCheck } from "lucide-react";

export default function VendorProfile() {
  const { toast } = useToast();
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div><h1 className="text-3xl font-serif font-bold">Business Profile</h1><p className="text-muted-foreground">Manage your vendor profile and verification status.</p></div>
        <Button className="bg-burgundy text-white">Save Changes</Button>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6"><div className="h-20 w-20 rounded-full bg-gold/10 flex items-center justify-center text-gold text-2xl font-bold">R</div><div><div className="font-serif font-2xl font-bold text-foreground">Royal Banquet Hall</div><div className="text-sm text-muted-foreground">Verified Vendor | Marriage Hall</div></div></div>
              <form className="space-y-5">
                <div className="space-y-2"><Label htmlFor="businessName">Business name</Label><Input id="businessName" defaultValue="Royal Banquet Hall" /></div>
                <div className="space-y-2"><Label>Category</Label><select className="border border-input bg-background rounded-md px-3 py-2 text-sm w-full">{VENDOR_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                <div className="space-y-2"><Label htmlFor="description">Description</Label><textarea id="description" rows="4" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="Premium marriage hall with in-house catering and decoration options." /></textarea></div>
                <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" defaultValue="Delhi" /></div>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3"><Phone className="h-4 w-4 shrink-0" /><div><div className="font-medium">+91 98765 43210</div><div className="text-xs text-muted-foreground">Business mobile</div></div></div>
                <div className="flex items-center gap-3"><Mail className="h-4 w-4 shrink-0" /><div><div className="font-medium">owner@royalbanquet.in</div><div className="text-xs text-muted-foreground">Business email</div></div></div>
                <div className="flex items-center gap-3"><MapPin className="h-4 w-4 shrink-0" /><div><div className="font-medium">Connaught Place, New Delhi</div><div className="text-xs text-muted-foreground">Venue address</div></div></div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4"><ShieldCheck className="h-5 w-5 text-burgundy" /><h3 className="font-semibold">Verification Status</h3></div>
              <div className="mb-4"><div className="text-sm text-muted-foreground">Your business is verified on UTSAV.</div></div>
              <h4 className="font-semibold mb-3">Working Hours</h4>
              <div className="space-y-2"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Monday - Saturday</span><span>10:00 AM - 7:00 PM</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Sunday</span><span>Closed</span></div></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


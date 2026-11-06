
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VendorSettings() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-serif font-bold">Settings</h1>
      <Card>
        <CardHeader><CardTitle className="text-lg font-serif">Business Settings</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2"><Label htmlFor="businessName">Business name</Label><Input id="businessName" defaultValue="Royal Banquet Hall" /></div>
          <div className="space-y-2"><Label htmlFor="email">Contact email</Label><Input id="email" type="email" defaultValue="owner@royalbanquet.in" /></div>
          <div className="space-y-2"><Label htmlFor="mobile">Contact mobile</Label><Input id="mobile" defaultValue="+91 98765 43210" /></div>
          <Button className="w-full bg-burgundy text-white">Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}


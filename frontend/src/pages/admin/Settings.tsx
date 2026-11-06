
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSettings() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-serif font-bold">Platform Settings</h1>
      <Card>
        <CardHeader><CardTitle className="text-lg font-serif">General Settings</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2"><Label htmlFor="platformName">Platform name</Label><Input id="platformName" defaultValue="UTSAV" /></div>
          <div className="space-y-2"><Label htmlFor="supportEmail">Support email</Label><Input id="supportEmail" type="email" defaultValue="hello@utsav.in" /></div>
          <Button className="w-full bg-burgundy text-white">Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}


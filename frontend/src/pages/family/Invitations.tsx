
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, ArrowRight, Play, Edit3, Trash2 } from "lucide-react";
import { invitationService } from "@/services/invitation.service";

export default function FamilyInvitations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: invitations, isLoading } = useQuery({ queryKey: ["familyInvitations"], queryFn: () => invitationService.listInvitations() });

  const handlePublish = async (id: string) => {
    if (!window.confirm("Publish this invitation? Guests will be able to view and RSVP.")) return;
    try {
      await invitationService.publish(id);
      toast({ title: "Published", description: "Your invitation is now live." });
      navigate(0, { overwrite: true });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Could not publish", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Invitations</h1>
          <p className="text-muted-foreground">Create and manage digital invitations for your events.</p>
        </div>
        <Link to="/family/invitations/editor/new" className="bg-burgundy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-deep-burgundy transition-colors flex items-center gap-2">
          <Mail className="h-4 w-4" /> Create Invitation
        </Link>
      </div>

      {isLoading ? (
        <div className="h-80 flex items-center justify-center text-muted-foreground">Loading invitations</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(invitations || []).map((inv) => (
            <Card key={inv.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1605028688220-18909157738e" alt={inv.name} className="w-full h-full object-cover" />
                <Badge className="absolute top-3 right-3">{inv.status}</Badge>
              </div>
              <CardContent className="pt-5">
                <h3 className="font-semibold text-foreground">{inv.name}</h3>
                <p className="text-sm text-muted-foreground">{inv.templateName || "Template"}  {inv.recipientCount} recipients</p>
              </CardContent>
              <CardFooter className="pt-4 gap-2">
                <Link to={"/invite/" + (inv.shareUrl || "demo")} className="flex-1 py-2 text-center text-sm font-semibold text-burgundy border border-border rounded-lg block">Preview</Link>
                <Button size="sm" variant={inv.status === "published" ? "outline" : "secondary"} onClick={() => handlePublish(inv.id)}>{inv.status === "published" ? "Published" : "Publish"}</Button>
                <Link to={"/family/invitations/editor/" + inv.id} className="flex-1 py-2 text-center text-sm font-semibold text-burgundy border border-border rounded-lg block">Edit</Link>
              </CardFooter>
            </Card>
          ))}
          {(invitations || []).length === 0 && <div className="p-10 text-center text-muted-foreground">No invitations yet. Create your first invitation.</div>}
        </div>
      )}
    </div>
  );
}


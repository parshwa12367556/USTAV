
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function GuestRSVPConfirmation() {
  const { token } = useParams();
  return (
    <div className="max-w-md mx-auto py-10 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center text-success mx-auto mb-4"><CheckCircle2 className="h-8 w-8" /></div>
      <h1 className="text-3xl font-serif font-bold text-foreground mb-2">RSVP Confirmed</h1>
      <p className="text-muted-foreground mb-6">Thank you for responding. Your attendance has been recorded.</p>
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Link to={"/invite/" + (token || "demo")} className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-muted">Back to Invitation</Link>
        <Link to="/" className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-burgundy text-white hover:bg-deep-burgundy transition-colors">Visit UTSAV</Link>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">Demo token: {token || "demo"}  Sample data only.</p>
    </div>
  );
}



import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, Calendar, Clock, Star } from "lucide-react";

export default function GuestInvitationView() {
  const { token } = useParams();
  return (
    <div className="max-w-md mx-auto py-10 px-4 space-y-6">
      <div className="text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-gold-foreground text-xl font-bold mx-auto mb-4">U</div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Aanya and Vihaan</h1>
        <p className="text-muted-foreground">You are invited to their wedding celebration</p>
      </div>
      <div className="bg-white rounded-2xl shadow-lg border border-border p-6 text-center">
        <div className="text-xs font-semibold tracking-wider text-burgundy/60 mb-2">You are Invited</div>
        <h2 className="text-2xl font-serif font-bold mb-2">Wedding Celebration</h2>
        <p className="text-muted-foreground mb-6">16 February 2026  10:00 AM</p>
        <div className="space-y-3 text-left mx-auto max-w-xs">
          <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-burgundy shrink-0" /><span>Grand Mandap Hall, Connaught Place, New Delhi</span></div>
          <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-burgundy shrink-0" /><span>16 February 2026, 10:00 AM  1:00 PM</span></div>
          <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-burgundy shrink-0" /><span>RSVP by 10 February 2026</span></div>
        </div>
        <p className="text-xs italic text-muted-foreground mt-6">We cordially invite you to bless us on our special day.</p>
      </div>
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-muted-foreground hover:underline">? Back to UTSAV</Link>
        <Link to={"/invite/" + (token || "demo") + "/rsvp"} className="bg-burgundy text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-deep-burgundy transition-colors">RSVP Now</Link>
      </div>
      <div className="p-4 rounded-xl border border-border bg-muted/50 text-center">
        <p className="text-xs text-muted-foreground">Opening this on WhatsApp? The invitation is mobile-friendly  no app install required.</p>
      </div>
    </div>
  );
}


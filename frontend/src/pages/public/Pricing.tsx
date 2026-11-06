
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Crown } from "lucide-react";

const plans = [
  { name: "Starter", price: 0, desc: "For small celebrations", features: ["Digital invitations", "Guest management", "RSVP tracking", "Basic templates"], highlight: false },
  { name: "Premium", price: 999, desc: "For grand weddings", features: ["Premium templates", "Vendor quotations", "Booking management", "Budget tracking", "Priority support"], highlight: true },
  { name: "Enterprise", price: 2999, desc: "For event planners", features: ["Everything in Premium", "Multiple events", "Vendor dashboard access", "API access", "Dedicated support"], highlight: false },
];

export default function Pricing() {
  return (
    <section>
      <div className="py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-serif font-bold mb-3">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground">Choose the plan that fits your celebration.</p>
        </div>
      </div>
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((p) => <Card key={p.name} className={p.highlight ? "ring-2 ring-gold" : ""}><CardHeader className="pb-3">{p.highlight && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gold text-gold-foreground text-[10px] font-bold uppercase mb-3">Most Popular</span>}<CardTitle className="text-2xl">{p.name}</CardTitle><p className="text-sm text-muted-foreground">{p.desc}</p></CardHeader><CardContent className="pt-0"><div className="mb-6"><span className="text-4xl font-serif font-bold">Rs.{p.price}</span> <span className="text-muted-foreground">one-time</span></div><ul className="space-y-3 text-sm text-muted-foreground mb-8">{p.features.map((f) => <li key={f} className="flex items-center gap-2"><Star className="h-4 w-4 fill-gold text-gold shrink-0" /><span>{f}</span></li>)}</ul><Link to={ROUTES.auth.register} className={`block w-full py-3 rounded-lg text-center font-semibold ${p.highlight ? "bg-burgundy text-white hover:bg-deep-burgundy" : "border border-border text-foreground hover:bg-muted"}`}>{p.highlight ? "Get Started" : "Choose Plan"}</Link></CardContent></Card>)}
          </div>
        </div>
      </section>
    </section>
  );
}



import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Play, Calendar, Users, MapPin, Tag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants";
import { invitationService } from "@/services/invitation.service";
import { venueService } from "@/services/venue.service";
import { cateringService } from "@/services/catering.service";
import { vendorService } from "@/services/vendor.service";

const services = [
  { title: "Wedding Invitations", desc: "Digital invitations with RSVP tracking.", icon: <MailIcon />, to: ROUTES.public.invitations },
  { title: "Wedding Venues", desc: "Marriage halls, banquet halls and gardens.", icon: <MapPin className="h-6 w-6" />, to: ROUTES.public.venues },
  { title: "Catering", desc: "Multi-cuisine caterers with custom menus.", icon: <SpoonIcon />, to: ROUTES.public.vendors },
  { title: "Decoration", desc: "Floral, stage and mandap decoration.", icon: <SparklesIcon />, to: ROUTES.public.vendors },
  { title: "Event Management", desc: "Full-service coordination.", icon: <Calendar className="h-6 w-6" />, to: ROUTES.public.vendors },
  { title: "Photography", desc: "Candid and traditional photography.", icon: <CameraIcon />, to: ROUTES.public.vendors },
  { title: "Transportation", desc: "Luxury wedding transport.", icon: <TruckIcon />, to: ROUTES.public.vendors },
  { title: "Entertainment", desc: "DJ, live music and performers.", icon: <MusicIcon />, to: ROUTES.public.vendors },
];

function MailIcon(){return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;}
function SpoonIcon(){return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.948 13H11z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055V7M11 3.055a8 8 0 018 8h.055m0 0h-.055a8 8 0 01-8 8h-.055M11 3.055V7M16.944 13H20"/></svg>;}
function SparklesIcon(){return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.043 8.867a4 4 0 00-2.53-4.533 4 4 0 00-4.533 2.53 4 4 0 002.53 4.533 4 4 0 004.533-2.53zM9.31 15.187a4 4 0 01-2.53 4.533 4 4 0 01-4.533-2.53 4 4 0 012.53-4.533 4 4 0 014.533 2.53zM21.033 11.74a4 4 0 00-4.533-2.53 4 4 0 00-2.53 4.533 4 4 0 004.533 2.53 4 4 0 004.533-2.53 4 4 0 00-2.53-4.533z"/></svg>;}
function CameraIcon(){return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a6 6 0 0112 0v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9zM6 15h3m3-3h3m-3 0v3m0 0v3m0-3h3m-3 0v-3M9 15V9m0 0l-3 3m3 3l3-3"/></svg>;}
function TruckIcon(){return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h14v3H4zm6 5H4a1 1 0 00-1 1v4a1 1 0 001 1h12a1 1 0 001-1v-4a1 1 0 00-1-1h-2M4 7l2 2M16 7l2 2"/></svg>;}
function MusicIcon(){return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"/></svg>;}

const steps = [
  { num: "01", title: "Create your event", desc: "Set up your family workspace and add your celebration details." },
  { num: "02", title: "Design your invitation", desc: "Choose a template and personalise your digital invitation." },
  { num: "03", title: "Invite your guests", desc: "Share your invitation link and track responses." },
  { num: "04", title: "Discover trusted vendors", desc: "Explore venues, caterers, decorators and more." },
  { num: "05", title: "Compare quotations", desc: "Request and compare quotes side by side." },
  { num: "06", title: "Book services", desc: "Confirm bookings and track payments." },
  { num: "07", title: "Celebrate your special day", desc: "Everything is in place. Enjoy your celebration." },
];

const IMG = (id: string) => "https://images.unsplash.com/photo-" + id;

export default function Home() {
  const { data: templates } = useQuery({
    queryKey: ["invitationTemplates"],
    queryFn: invitationService.listTemplates,
  });

  const { data: venues } = useQuery({
    queryKey: ["featuredVenues"],
    queryFn: () => venueService.list(),
  });

  const { data: caterers } = useQuery({
    queryKey: ["featuredCaterers"],
    queryFn: () => cateringService.list(),
  });

  const { data: vendors } = useQuery({
    queryKey: ["marketplaceVendors"],
    queryFn: () => vendorService.list(),
  });

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-burgundy/90 text-white pt-20 pb-32 md:pt-32 md:pb-40">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url(" + IMG("1519741497674-611481863552") + ")" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-semibold mb-6 uppercase tracking-wider">
            Every Celebration, One Place.
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 leading-tight">
            Every Celebration,<br className="hidden md:block" /> One Place.
          </h1>
          <p className="text-lg md:text-xl text-secondary/80 max-w-2xl mx-auto mb-10">
            Plan your perfect celebration with beautiful invitations, trusted venues, stunning caterers and everything you need to make your special day unforgettable.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={ROUTES.auth.register} className="px-8 py-4 bg-gold text-gold-foreground text-lg font-semibold rounded-xl hover:bg-gold/90 transition-colors flex items-center justify-center gap-2">
              Start Planning <ArrowRight className="h-5 w-5" />
            </Link>
            <button className="px-8 py-4 bg-white/10 text-white border border-white/20 text-lg font-semibold rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
              <Play className="h-5 w-5" /> Explore Services
            </button>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-xs text-secondary/60 uppercase tracking-widest">
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> <span>Multiple Functions</span></div>
            <div className="flex items-center gap-2"><Users className="h-4 w-4" /> <span>Guest Management</span></div>
            <div className="flex items-center gap-2"><Tag className="h-4 w-4" /> <span>Quotation Comparison</span></div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-3">Services We Offer</h2>
            <p className="text-muted-foreground">Everything you need for your celebration, in one place.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {services.map((s) => (
              <Card key={s.title} className="hover:shadow-lg transition-shadow group cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3 group-hover:bg-gold group-hover:text-gold-foreground transition-colors">
                    {s.icon}
                  </div>
                  <CardTitle className="text-lg">{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-3">How UTSAV Works</h2>
            <p className="text-muted-foreground">Plan your celebration in seven simple steps.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-burgundy text-white font-bold text-sm">{s.num}</div>
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-serif font-bold text-foreground mb-1">Featured Venues</h2>
              <p className="text-muted-foreground">Handpicked marriage halls and banquet halls.</p>
            </div>
            <Link to={ROUTES.public.venues} className="text-sm font-medium text-burgundy hover:underline">View all venues</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(venues || []).slice(0, 3).map((v) => (
              <Card key={v.id} className="overflow-hidden">
                <div className="h-48 overflow-hidden relative">
                  <img src={v.images[0] || IMG("1486325212027-8081e485255e")} alt={v.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  <Badge className="absolute top-3 right-3">?{v.pricePerDay.toLocaleString()}/day</Badge>
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-semibold">{v.name}</h3>
                  <p className="text-sm text-muted-foreground">{v.city}  {v.capacity} guests</p>
                  <p className="text-xs text-muted-foreground mt-1">{v.facilities.slice(0,3).join("  ")}</p>
                </CardContent>
                <CardFooter>
                  <Link to={"/venues/" + v.id} className="w-full py-2 text-center text-sm font-semibold text-burgundy">View Details</Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-3">Trusted Vendors</h2>
            <p className="text-muted-foreground">Verified service providers across India.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {(vendors || []).map((v) => (
              <Card key={v.id}>
                <CardContent className="pt-6 pb-4">
                  <div className="h-32 rounded-xl bg-muted mb-4 flex items-center justify-center text-muted-foreground">
                    Portfolio
                  </div>
                  <h3 className="font-semibold text-foreground">{v.businessName}</h3>
                  <p className="text-sm text-muted-foreground">{v.city}  {v.category.replace("_"," ")}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs">
                    <Star className="fill-gold text-gold" /> <span className="font-medium">{v.rating}</span> <span className="text-muted-foreground">({v.reviewCount})</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link to={ROUTES.public.vendors} className="w-full py-2 text-center text-sm font-semibold text-burgundy">View Profile</Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-serif font-bold text-foreground mb-1">Invitation Templates</h2>
              <p className="text-muted-foreground">Free and premium designs for every function.</p>
            </div>
            <Link to={ROUTES.public.invitations} className="text-sm font-medium text-burgundy hover:underline">Browse all templates</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {(templates || []).slice(0, 6).map((t) => (
              <Card key={t.id}>
                <div className="h-48 overflow-hidden relative mb-4">
                  <img src={t.previewImage || IMG("1605028688220-18909157738e")} alt={t.name} className="w-full h-full object-cover" />
                  <Badge className="absolute top-3 left-3">{t.isFree ? "Free" : "Premium"}</Badge>
                  <span className="absolute top-3 right-3 bg-gold text-gold-foreground text-xs font-bold px-2 py-1 rounded">?{t.price}</span>
                </div>
                <CardContent>
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="text-xs text-muted-foreground">{t.category}</p>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button variant="outline" size="sm" className="w-1/2">Preview</Button>
                  <Button size="sm" className="w-1/2">Customize</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-3">What Families Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Demonstration testimonials. Real customer reviews will appear after launch.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1,2,3].map((i) => (
              <Card key={i} className="p-8">
                <p className="text-muted-foreground italic mb-4">"UTSAV made our wedding planning effortless. The invitations and guest management were fantastic."</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">A</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Aanya and Vihaan</p>
                    <p className="text-xs text-muted-foreground">Delhi  Wedding</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}



export default function HowItWorks() {
  const steps = [
    { num: "01", title: "Create your event", desc: "Set up your family workspace, add celebration details and choose your wedding date." },
    { num: "02", title: "Design your invitation", desc: "Pick a template, personalise with photos, colours and fonts, then publish." },
    { num: "03", title: "Invite your guests", desc: "Share your invitation link via WhatsApp or email and track who opens it." },
    { num: "04", title: "Manage RSVPs", desc: "Guests respond function by function. See confirmed, pending and declined counts in real time." },
    { num: "05", title: "Discover vendors", desc: "Browse venues, caterers, decorators and photographers. Request quotations and compare them." },
    { num: "06", title: "Book and pay", desc: "Accept a quotation, confirm your booking and track payments against your budget." },
    { num: "07", title: "Celebrate", desc: "Everything is in place. Enjoy your special day with UTSAV." },
  ];

  return (
    <div className="flex flex-col">
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-serif font-bold mb-6">How UTSAV Works</h1>
          <p className="text-muted-foreground mb-10">Plan your celebration in seven simple steps.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-burgundy text-white font-serif font-bold text-2xl">{s.num}</div>
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}



export default function FAQ() {
  const faqs = [
    { q: "What is UTSAV?", a: "UTSAV is a complete Indian wedding and event planning platform that helps families plan celebrations, create invitations, manage guests, discover venues and vendors, request quotations and manage bookings." },
    { q: "Who can use UTSAV?", a: "Families and event organizers, vendors and service providers, platform administrators, and guests receiving invitations." },
    { q: "Do guests need to install an app?", a: "No. Guests receive a personalized invitation link and can RSVP from any mobile browser without installing anything." },
    { q: "Is venue booking for hotel rooms?", a: "No. UTSAV is for event venues  marriage halls, banquet halls, convention centres, gardens and event spaces  not ordinary hotel room bookings." },
    { q: "Are the vendors verified?", a: "Vendors can submit verification requests which platform administrators review. Verification status is shown on each vendor profile." },
    { q: "Is sample data used?", a: "Yes. Until the backend is connected, the frontend uses clearly labelled demonstration data so you can explore the full experience." },
  ];

  return (
    <div className="flex flex-col">
      <section className="py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-serif font-bold mb-3">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">Everything you need to know about UTSAV.</p>
        </div>
      </section>
      <section className="py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="border-b border-border pb-6 last:border-0">
                <h3 className="font-semibold text-foreground">{f.q}</h3>
                <p className="text-sm text-muted-foreground mt-2">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}


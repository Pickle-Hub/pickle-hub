import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CLUB, waLink } from "@/lib/pickle";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Location & Contact — Pickle Hub" },
      {
        name: "description",
        content: "Find Pickle Hub in Saratha Nagar, Sivakasi. Open 5 AM to midnight daily. Call, WhatsApp or email us.",
      },
      { property: "og:title", content: "Location & Contact — Pickle Hub" },
      { property: "og:description", content: "Directions, opening hours and contact details for Pickle Hub in Sivakasi." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <SiteLayout>
      <section className="bg-royal py-16 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Visit Pickle Hub</p>
          <h1 className="mt-3 font-display text-4xl font-black sm:text-5xl">Location & Contact</h1>
          <p className="mt-4 max-w-xl text-primary-foreground/75">
            Two floodlit courts in Saratha Nagar, Sivakasi. Parking on site, an on-site café and paddle rentals
            available.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-2">
        <Card className="rounded-3xl border-border/70 p-8 shadow-soft">
          <h2 className="font-display text-2xl font-bold">Reach us</h2>
          <ul className="mt-6 space-y-5 text-sm">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              {CLUB.address}
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              {CLUB.hours}
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <a className="hover:underline" href={`tel:+91${CLUB.phone}`}>
                +91 {CLUB.phoneDisplay}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <a className="hover:underline" href={`mailto:${CLUB.email}`}>
                {CLUB.email}
              </a>
            </li>
            <li className="flex gap-3">
              <Instagram className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <a className="hover:underline" href={`https://instagram.com/${CLUB.instagram}`} target="_blank" rel="noreferrer">
                @{CLUB.instagram}
              </a>
            </li>
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="hero" size="lg">
              <Link to="/book">Book a court</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={waLink(CLUB.phone, "Hi Pickle Hub, I'd like to know more about court bookings.")} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" /> WhatsApp us
              </a>
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden rounded-3xl border-border/70 p-0 shadow-soft">
          <iframe
            title="Pickle Hub location map"
            loading="lazy"
            className="h-full min-h-[380px] w-full border-0"
            src={`https://www.google.com/maps?q=${CLUB.mapsQuery}&output=embed`}
          />
        </Card>
      </section>
    </SiteLayout>
  );
}

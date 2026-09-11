import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Droplets,
  Mail,
  MapPin,
  Phone,
  Quote,
  Coffee,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAvailability, useCourts } from "@/hooks/usePickle";
import { CLUB, inr, toDateKey } from "@/lib/pickle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Pickle Hub — Book Your Court. Play Your Game.",
      },
      {
        name: "description",
        content:
          "Premium pickleball at Pickle Hub: two floodlit championship courts, hourly booking from 5 AM to midnight, weekday rates from ₹500 and weekend rates from ₹600.",
      },
      {
        property: "og:title",
        content: "Pickle Hub — Book Your Court. Play Your Game.",
      },
      {
        property: "og:description",
        content:
          "Two floodlit championship pickleball courts. Weekday rates from ₹500/hr and weekend rates from ₹600/hr.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const today = toDateKey(new Date());

  const { data: courts } = useCourts();
  const { data: availability } = useAvailability(today);

  const c1 = courts?.[0];

  /*
   * Pickle Hub pricing
   *
   * Monday-Friday:
   *   5:00 AM - 5:00 PM  = ₹500/hr
   *   5:00 PM - 12:00 AM = ₹700/hr
   *
   * Saturday-Sunday:
   *   5:00 AM - 5:00 PM  = ₹600/hr
   *   5:00 PM - 12:00 AM = ₹800/hr
   */

  const weekdayDayRate = 500;
  const weekdayEveningRate = 700;
  const weekendDayRate = 600;
  const weekendEveningRate = 800;

  const totalSlots =
    (courts?.length ?? 2) *
    ((c1?.closing_hour ?? 24) - (c1?.opening_hour ?? 5));

  const takenNow =
    (availability?.taken.length ?? 0) +
    (availability?.blocked.length ?? 0);

  const freeNow = Math.max(totalSlots - takenNow, 0);

  return (
    <SiteLayout>
      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative isolate overflow-hidden bg-ink">
        <img
          src="/court.png"
          alt="Floodlit premium pickleball court at Pickle Hub"
          width={1920}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />

        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/85 to-primary/40" />

        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-24 sm:px-6 md:pt-28 md:pb-32">
          <span className="reveal inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gold">
            <Sparkles className="h-3.5 w-3.5" />
            Premium Pickleball Club
          </span>

          <h1 className="reveal mt-6 max-w-4xl font-display text-4xl font-black leading-[1.05] text-ink-foreground sm:text-6xl md:text-7xl">
            Book Your Court.
            <br />
            <span className="text-gold-gradient">
              Play Your Game.
            </span>
          </h1>

          <p className="reveal mt-6 max-w-xl text-base leading-relaxed text-ink-foreground/75 sm:text-lg">
            Two championship-grade courts, cushioned acrylic surface and
            tournament floodlights — open from 5:00 AM to midnight, every
            single day.
          </p>

          <div className="reveal mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="hero" size="xl">
              <Link to="/book">
                Book Now
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>

            <Button asChild variant="outlineGold" size="xl">
              <a href="#courts">View Courts</a>
            </Button>
          </div>

          {/* Hero Stats */}
          <div className="reveal mt-14 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {[
              {
                icon: CheckCircle2,
                k: `${freeNow} slots`,
                v: "Free today",
              },
              {
                icon: CreditCard,
                k: `${inr(weekdayDayRate)}/hr`,
                v: "Weekdays · before 5 PM",
              },
              {
                icon: Clock,
                k: "5 AM – 12 AM",
                v: "Open all week",
              },
              {
                icon: Users,
                k: `${courts?.length ?? 2} courts`,
                v: "Floodlit, all week",
              },
            ].map((s) => (
              <div key={s.k} className="glass rounded-2xl p-4">
                <s.icon className="h-5 w-5 text-gold" />

                <p className="mt-3 font-display text-lg font-bold text-ink-foreground">
                  {s.k}
                </p>

                <p className="text-xs text-ink-foreground/60">
                  {s.v}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          WHY PICKLE HUB
      ========================================================= */}
      <section className="section-pad mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Why Pickle Hub"
          title="A club built around your game"
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Trophy,
              t: "Tournament-grade courts",
              d: "Cushioned acrylic surfaces with regulation lines and pro nets, resurfaced every season.",
            },
            {
              icon: Clock,
              t: "19 hours of play daily",
              d: "From the 5 AM sunrise rally to a midnight doubles session — the lights never let you down.",
            },
            {
              icon: CalendarCheck,
              t: "Instant, honest booking",
              d: "Live availability, no double bookings, and a booking number the second you confirm.",
            },
          ].map((f) => (
            <Card
              key={f.t}
              className="group rounded-3xl border-border/70 p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-royal text-primary-foreground shadow-soft">
                <f.icon className="h-6 w-6" />
              </div>

              <h3 className="mt-5 font-display text-xl font-bold">
                {f.t}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.d}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* =========================================================
          COURTS
      ========================================================= */}
      <section id="courts" className="section-pad bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Our Courts"
            title="Two courts. Zero compromise."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              {
                img: "/court.png",
                pos: "object-bottom",
                court: courts?.[0],
                fallback: "Court 1",
              },
              {
                img: "/court1.jpeg",
                pos: "object-right",
                court: courts?.[1],
                fallback: "Court 2",
              },
            ].map((c, i) => (
              <Card
                key={i}
                className="overflow-hidden rounded-3xl border-border/70 p-0 shadow-soft transition-all hover:shadow-lift"
              >
                <img
                  src={c.img}
                  alt={`${c.court?.name ?? c.fallback} at Pickle Hub`}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className={`h-56 w-full object-cover ${c.pos}`}
                />

                <div className="p-7">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-2xl font-bold">
                      {c.court?.name ?? c.fallback}
                    </h3>

                    <span className="rounded-full border border-success/30 bg-success/12 px-3 py-1 text-xs font-bold text-success">
                      Open
                    </span>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                    <Spec
                      label="Surface"
                      value={
                        c.court?.surface ??
                        "Acrylic Cushioned"
                      }
                    />

                    <Spec
                      label="Slot length"
                      value="60 minutes"
                    />

                    <Spec
                      label="Weekday day"
                      value={`${inr(weekdayDayRate)}/hr`}
                    />

                    <Spec
                      label="Weekend day"
                      value={`${inr(weekendDayRate)}/hr`}
                    />

                    <Spec
                      label="Weekday evening"
                      value={`${inr(weekdayEveningRate)}/hr`}
                    />

                    <Spec
                      label="Weekend evening"
                      value={`${inr(weekendEveningRate)}/hr`}
                    />
                  </dl>

                  <Button
                    asChild
                    variant="royal"
                    className="mt-6 w-full"
                    size="lg"
                  >
                    <Link to="/book">
                      Book {c.court?.name ?? c.fallback}
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Court Features */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Coffee,
                t: "Café on site",
              },
              {
                icon: CalendarCheck,
                t: "Instant booking",
              },
              {
                icon: Droplets,
                t: "Hydration station",
              },
              {
                icon: Users,
                t: "Paddle rentals",
              },
            ].map((f) => (
              <div
                key={f.t}
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 text-sm font-semibold"
              >
                <f.icon className="h-4.5 w-4.5 text-primary" />
                {f.t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          PRICING
      ========================================================= */}
      <section className="section-pad mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple hourly pricing"
        />

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Choose your court time and pay according to the day and time
          you select. Weekday and weekend rates are clearly shown below.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* DAY RATE CARD */}
          <Card className="rounded-3xl border-border/70 p-8 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Day Rate
            </p>

            <p className="mt-3 font-display text-5xl font-black">
              {inr(weekdayDayRate)}
              <span className="text-base font-semibold text-muted-foreground">
                {" "}
                / hour
              </span>
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Monday–Friday · 5:00 AM to 5:00 PM
            </p>

            <div className="mt-6 rounded-2xl bg-muted/60 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Weekend Day Rate
              </p>

              <p className="mt-2 font-display text-3xl font-black">
                {inr(weekendDayRate)}
                <span className="text-sm font-semibold text-muted-foreground">
                  {" "}
                  / hour
                </span>
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Saturday & Sunday · 5:00 AM to 5:00 PM
              </p>
            </div>

            <ul className="mt-6 space-y-2.5 text-sm">
              {[
                "60-minute court slot",
                "Up to 4 players",
                "Nets, lines & lighting included",
              ].map((x) => (
                <li key={x} className="flex gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-success" />
                  {x}
                </li>
              ))}
            </ul>
          </Card>

          {/* EVENING RATE CARD */}
          <Card className="relative overflow-hidden rounded-3xl border-transparent bg-royal p-8 text-primary-foreground shadow-lift">
            <span className="absolute right-6 top-6 rounded-full bg-gold px-3 py-1 text-xs font-bold text-gold-foreground">
              Prime time
            </span>

            <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70">
              Evening Rate
            </p>

            <p className="mt-3 font-display text-5xl font-black">
              {inr(weekdayEveningRate)}
              <span className="text-base font-semibold text-primary-foreground/70">
                {" "}
                / hour
              </span>
            </p>

            <p className="mt-2 text-sm text-primary-foreground/75">
              Monday–Friday · 5:00 PM to 12:00 AM
            </p>

            <div className="mt-6 rounded-2xl bg-white/10 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70">
                Weekend Evening Rate
              </p>

              <p className="mt-2 font-display text-3xl font-black">
                {inr(weekendEveningRate)}
                <span className="text-sm font-semibold text-primary-foreground/70">
                  {" "}
                  / hour
                </span>
              </p>

              <p className="mt-1 text-xs text-primary-foreground/70">
                Saturday & Sunday · 5:00 PM to 12:00 AM
              </p>
            </div>

            <ul className="mt-6 space-y-2.5 text-sm">
              {[
                "Full floodlights",
                "Peak-hour court prep",
                "Priority on rentals",
              ].map((x) => (
                <li key={x} className="flex gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-gold" />
                  {x}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS
      ========================================================= */}
      <section className="section-pad bg-ink text-ink-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="How booking works"
            title="Four taps to court time"
            dark
          />

          <ol className="mt-12 grid gap-5 md:grid-cols-4">
            {[
              {
                n: "01",
                t: "Pick a date",
                d: "Choose any day up to a month ahead.",
              },
              {
                n: "02",
                t: "Pick a court & slot",
                d: "Live availability for Court 1 and Court 2.",
              },
              {
                n: "03",
                t: "Confirm",
                d: "Review the price and lock the hour instantly.",
              },
              {
                n: "04",
                t: "Pay by UPI",
                d: "Scan the QR, submit your reference, done.",
              },
            ].map((s) => (
              <li key={s.n} className="glass rounded-3xl p-6">
                <span className="font-display text-3xl font-black text-gold">
                  {s.n}
                </span>

                <h3 className="mt-3 font-display text-lg font-bold">
                  {s.t}
                </h3>

                <p className="mt-1.5 text-sm text-ink-foreground/65">
                  {s.d}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* =========================================================
          REVIEWS
      ========================================================= */}
      <section className="section-pad mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Customer reviews"
          title="Loved by the local circuit"
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              n: "Anish",
              r: "Best surface in the city. The 6 AM slot is my daily ritual now.",
            },
            {
              n: "Divya Raghavan",
              r: "Booking takes seconds and the UPI confirmation is instant. Zero friction.",
            },
            {
              n: "Karthik S.",
              r: "Floodlights are genuinely tournament level. We play doubles till 11 PM.",
            },
          ].map((t) => (
            <Card
              key={t.n}
              className="rounded-3xl border-border/70 p-7 shadow-soft"
            >
              <Quote className="h-7 w-7 text-primary/25" />

              <p className="mt-4 text-sm leading-relaxed">
                {t.r}
              </p>

              <div className="mt-5 flex items-center justify-between">
                <span className="font-display text-sm font-bold">
                  {t.n}
                </span>

                <span className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-gold text-gold"
                    />
                  ))}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* =========================================================
          LOCATION + CONTACT
      ========================================================= */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <Card className="overflow-hidden rounded-3xl border-border/70 p-0 shadow-lift md:grid md:grid-cols-2">
          <div className="p-8 md:p-12">
            <SectionHeading
              eyebrow="Location & contact"
              title="Come play with us"
            />

            <ul className="mt-8 space-y-5 text-sm">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                <span>{CLUB.address}</span>
              </li>

              <li className="flex gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                <span>{CLUB.hours}</span>
              </li>

              <li className="flex gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                <a
                  className="hover:underline"
                  href={`tel:${CLUB.phone.replace(/\s/g, "")}`}
                >
                  {CLUB.phone}
                </a>
              </li>

              <li className="flex gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                <a
                  className="hover:underline"
                  href={`mailto:${CLUB.email}`}
                >
                  {CLUB.email}
                </a>
              </li>
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="hero" size="lg">
                <Link to="/book">Book a court</Link>
              </Button>

              <Button asChild variant="outline" size="lg">
                <Link to="/contact">Get directions</Link>
              </Button>
            </div>
          </div>

          <iframe
            title="Pickle Hub location map"
            loading="lazy"
            className="h-72 w-full border-0 md:h-full"
            src={`https://www.google.com/maps?q=${CLUB.mapsQuery}&output=embed`}
          />
        </Card>
      </section>
    </SiteLayout>
  );
}

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({
  eyebrow,
  title,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  dark?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-xs font-bold uppercase tracking-[0.2em] ${
          dark ? "text-gold" : "text-primary"
        }`}
      >
        {eyebrow}
      </p>

      <h2 className="mt-3 max-w-2xl font-display text-3xl font-black sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}

/* =========================================================
   COURT SPEC
========================================================= */

function Spec({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-0.5 font-semibold">
        {value}
      </dd>
    </div>
  );
}
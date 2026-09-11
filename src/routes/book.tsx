import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useAvailability, useCourts } from "@/hooks/usePickle";
import { supabase } from "@/integrations/supabase/client";
import { addDays, hourList, inr, isPast, prettyDate, rateFor, slotLabel, toDateKey } from "@/lib/pickle";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a Court — Pickle Hub" },
      {
        name: "description",
        content: "Check live availability and book a floodlit Pickle Hub court by the hour, 5 AM to midnight.",
      },
      { property: "og:title", content: "Book a Court — Pickle Hub" },
      { property: "og:description", content: "Real-time court availability and instant UPI booking at Pickle Hub." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <BookPage />
    </SiteLayout>
  ),
});

function BookPage() {
  const today = toDateKey(new Date());
  const [dateKey, setDateKey] = useState(today);
  const [courtId, setCourtId] = useState<number | null>(null);
  const [hour, setHour] = useState<number | null>(null);
  const [method, setMethod] = useState<"UPI_QR" | "VENUE">("UPI_QR");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (profile?.full_name) setName((n) => n || profile.full_name);
    if (profile?.phone_number) setPhone((p) => p || profile.phone_number);
  }, [profile?.full_name, profile?.phone_number]);
  const { data: courts = [] } = useCourts();
  const { data: availability, isLoading } = useAvailability(dateKey);

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i)), [today]);
  const activeCourts = courts.filter((c) => c.active);
  const court = activeCourts.find((c) => c.id === courtId) ?? null;

  const stateFor = (cid: number, h: number) => {
    if (isPast(dateKey, h)) return "PAST";
    const blocked = availability?.blocked.some(
      (b) => (b.court_id === null || b.court_id === cid) && (b.slot_hour === null || b.slot_hour === h),
    );
    if (blocked) return "BLOCKED";
    const taken = availability?.taken.find((t) => t.court_id === cid && t.slot_hour === h);
    if (taken) return taken.state === "BOOKED" ? "BOOKED" : "HELD";
    return "AVAILABLE";
  };

  const amount = court && hour !== null ? rateFor(court, hour, dateKey) : 0;

  const digits = phone.replace(/\D/g, "");
  const canBook = name.trim().length >= 2 && digits.length >= 10 && digits.length <= 15;

  const confirm = async () => {
  if (!court || hour === null) return;

  if (!canBook) {
    toast.error("Enter your name and a valid phone number");
    return;
  }

  setBusy(true);

  const { data, error } = await supabase.rpc("create_guest_booking", {
    _court_id: court.id,
    _booking_date: dateKey,
    _slot_hour: hour,
    _payment_method: method,
    _customer_name: name.trim(),
    _customer_phone: digits,
  });

  setBusy(false);

  if (error) {
    toast.error(error.message);
    return;
  }

  const row = data as unknown as { id: string };

  toast.success(
    user
      ? "Slot reserved! Complete your payment."
      : "Guest booking created! Complete your payment.",
  );

  void navigate({
    to: "/booking/$id",
    params: { id: row.id },
  });
};

  return (
    <>
      <section className="bg-royal py-12 text-primary-foreground">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Live availability</p>
              <h1 className="mt-3 font-display text-4xl font-black sm:text-5xl">Book a Court</h1>
              <p className="mt-3 max-w-xl text-primary-foreground/75">
                Two premium courts, hourly slots from 5 AM to midnight. Slots update in real time.
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Calendar Date Picker */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
            <CalendarDays className="h-5 w-5 text-primary" />
            Pick a date
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Select a date from the calendar or use the quick dates below.
          </p>
        </div>

        {/* Full Calendar Picker */}
        <div className="w-full sm:w-auto">
          <label
            htmlFor="booking-date"
            className="mb-2 block text-sm font-semibold"
          >
            Select date
          </label>

          <input
            id="booking-date"
            type="date"
            min={today}
            value={dateKey}
            onChange={(e) => {
              const selectedDate = e.target.value;

              if (!selectedDate) return;

              setDateKey(selectedDate);
              setCourtId(null);
              setHour(null);
            }}
            className="h-11 w-full min-w-[230px] rounded-xl border border-border bg-background px-4 text-sm font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Existing Quick Date Ribbon */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {days.map((d) => {
          const dt = new Date(`${d}T00:00:00`);

          return (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDateKey(d);
                setCourtId(null);
                setHour(null);
              }}
              className={cn(
                "min-w-[86px] shrink-0 rounded-xl border border-border px-3 py-3 text-center transition-all",
                dateKey === d
                  ? "border-primary bg-primary text-primary-foreground shadow-soft"
                  : "hover:bg-accent",
              )}
            >
              <span className="block text-xs font-semibold uppercase opacity-75">
                {dt.toLocaleDateString("en-IN", {
                  weekday: "short",
                })}
              </span>

              <span className="mt-1 block text-lg font-black">
                {dt.getDate()}
              </span>

              <span className="block text-[11px] opacity-75">
                {dt.toLocaleDateString("en-IN", {
                  month: "short",
                })}
              </span>
            </button>
          );
        })}
      </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            {isLoading && (
              <div className="grid h-40 place-items-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            {activeCourts.map((c) => (
            <Card key={c.id} className="overflow-hidden p-0">
              
              <img
                src="/court.png"
                alt={c.name}
                className="h-56 w-full object-cover"
              />

              <div className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-xl font-extrabold">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {/* {c.surface} · Day {inr(c.day_rate)}/hr · After {c.evening_start_hour}:00 {inr(c.evening_rate)}/hr */}
                      {c.surface} · Mon–Fri: ₹500/hr before 5 PM, ₹700/hr from 5 PM · Sat–Sun: ₹600/hr before 5 PM, ₹800/hr from 5 PM
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                  {hourList(c.opening_hour, c.closing_hour).map((h) => {
                    const st = stateFor(c.id, h);
                    const selected = courtId === c.id && hour === h;
                    const disabled = st !== "AVAILABLE";
                    return (
                      <button
                        key={h}
                        disabled={disabled}
                        onClick={() => {
                          setCourtId(c.id);
                          setHour(h);
                        }}
                        className={cn(
                          "rounded-lg border px-2 py-2.5 text-xs font-semibold transition-all",
                          disabled && "cursor-not-allowed border-border bg-muted text-muted-foreground line-through",
                          !disabled && "border-success/40 bg-success/10 text-success hover:-translate-y-0.5",
                          selected && "border-primary bg-primary text-primary-foreground shadow-soft",
                        )}
                      >
                        {slotLabel(h).split(" – ")[0]}
                        <span className="mt-0.5 block text-[10px] font-bold opacity-80">{inr(rateFor(c, h, dateKey))}</span>
                      </button>
                    );
                  })}
                </div>
              </div>  
              </Card>
            ))}
          </div>

          <Card className="h-fit p-5 lg:sticky lg:top-24">
            <h3 className="font-display text-lg font-extrabold">Booking summary</h3>
            {!court || hour === null ? (
              <p className="mt-3 text-sm text-muted-foreground">Select a court and a time slot to continue.</p>
            ) : (
              <div className="mt-4 space-y-3 text-sm">
                <Row label="Date" value={prettyDate(dateKey)} />
                <Row label="Court" value={court.name} />
                <Row label="Slot" value={slotLabel(hour)} />
                <div className="space-y-2 border-t border-border pt-3">
                  <Label htmlFor="cust-name">Your name</Label>
                  <Input
                    id="cust-name"
                    maxLength={80}
                    placeholder="e.g. Sowmiya B"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Label htmlFor="cust-phone">Phone number</Label>
                  <Input
                    id="cust-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={15}
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(["UPI_QR", "VENUE"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMethod(m)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-xs font-semibold",
                          method === m ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
                        )}
                      >
                        {m === "UPI_QR" ? "Pay via UPI" : "Pay at venue"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="font-display text-2xl font-black text-primary">{inr(amount)}</span>
                </div>
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={busy || !canBook}
                  onClick={() => void confirm()}
                >
                  {busy ? "Reserving…" : "Confirm booking"}
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  No account needed — save the receipt link after booking.
                </p>
              </div>
            )}
          </Card>
        </div>
      </section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

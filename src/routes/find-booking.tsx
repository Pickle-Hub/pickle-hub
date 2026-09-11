import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/find-booking")({
  head: () => ({
    meta: [
      {
        title: "Find My Booking — Pickle Hub",
      },
      {
        name: "description",
        content:
          "Find your Pickle Hub guest booking using your booking code and phone number.",
      },
      {
        property: "og:title",
        content: "Find My Booking — Pickle Hub",
      },
      {
        property: "og:description",
        content:
          "Recover your Pickle Hub booking receipt using your booking code and phone number.",
      },
    ],
  }),
  component: FindBookingPage,
});

function FindBookingPage() {
  const navigate = useNavigate();

  const [bookingCode, setBookingCode] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const findBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = bookingCode.trim().toUpperCase();
    const digits = phone.replace(/\D/g, "");

    if (!code) {
      toast.error("Please enter your booking code");
      return;
    }

    if (!digits || digits.length < 10 || digits.length > 15) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setBusy(true);

    const { data, error } = await (supabase as any).rpc("find_guest_booking", {
  _booking_code: code,
  _phone: digits,
});

    setBusy(false);

    if (error) {
      console.error("Find booking error:", error);
      toast.error("Unable to find booking. Please try again.");
      return;
    }

    /*
     * Supabase may return either:
     * - an array containing the booking
     * - a single object
     * - null / false when nothing is found
     */
    const row =
      Array.isArray(data)
        ? data[0]
        : data && typeof data === "object"
          ? data
          : null;

    if (!row || typeof row !== "object" || !("id" in row)) {
      toast.error(
        "No booking found. Please check your booking code and phone number.",
      );
      return;
    }

    const bookingId = String(row.id);

    if (!bookingId) {
      toast.error(
        "No booking found. Please check your booking code and phone number.",
      );
      return;
    }

    toast.success("Booking found!");

    void navigate({
      to: "/booking/$id",
      params: {
        id: bookingId,
      },
    });
  };

  return (
    <SiteLayout>
      <section className="mx-auto flex max-w-2xl flex-col items-center px-4 py-14 sm:px-6 sm:py-20">
        {/* Logo */}
        <img
          src="/favicon.png"
          alt="Pickle Hub"
          className="h-20 w-20 rounded-xl object-contain"
        />

        {/* Heading */}
        <div className="mt-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Guest booking
          </p>

          <h1 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl">
            Find My Booking
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            Forgot to print your receipt? No problem. Enter the booking code
            and phone number you used while booking to retrieve your booking.
          </p>
        </div>

        {/* Main Card */}
        <Card className="mt-8 w-full max-w-md p-6 sm:p-7">
          {/* Information box */}
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>

            <div>
              <p className="font-semibold">Recover your receipt</p>

              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Your booking code can be found on your original booking
                confirmation.
              </p>
            </div>
          </div>

          {/* Find Booking Form */}
          <form className="space-y-5" onSubmit={findBooking}>
            {/* Booking Code */}
            <div className="space-y-2">
              <Label htmlFor="booking-code">Booking Code</Label>

              <Input
                id="booking-code"
                type="text"
                required
                maxLength={30}
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="e.g. PH-ABC123"
                value={bookingCode}
                onChange={(e) =>
                  setBookingCode(e.target.value.toUpperCase())
                }
              />

              <p className="text-xs text-muted-foreground">
                Enter the booking code exactly as shown on your receipt.
              </p>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="booking-phone">Phone Number</Label>

              <Input
                id="booking-phone"
                type="tel"
                required
                maxLength={20}
                autoComplete="tel"
                placeholder="Enter the phone number used for booking"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <p className="text-xs text-muted-foreground">
                Use the same phone number you entered when booking.
              </p>
            </div>

            {/* Find Booking Button */}
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={busy}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finding booking...
                </>
              ) : (
                <>
                  Find My Booking
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Security Note */}
          <div className="mt-6 flex items-start gap-2 border-t border-border pt-5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

            <p className="text-xs leading-relaxed text-muted-foreground">
              Your booking is shown only when the booking code and phone
              number match our records.
            </p>
          </div>
        </Card>

        {/* Bottom Link */}
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
          <Button asChild variant="ghost">
            <Link to="/book">
              <CalendarDays className="h-4 w-4" />
              Book a court
            </Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
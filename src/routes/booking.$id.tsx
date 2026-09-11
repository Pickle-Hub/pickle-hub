import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Printer, QrCode, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useBooking, useCourts, usePaymentSettings } from "@/hooks/usePickle";
import { supabase } from "@/integrations/supabase/client";
import { CLUB, inr, paymentMeta, prettyDate, slotLabel, statusMeta, waLink } from "@/lib/pickle";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/booking/$id")({
  head: () => ({
    meta: [
      { title: "Booking Details & Payment — Pickle Hub" },
      { name: "description", content: "Complete your UPI payment and print your Pickle Hub booking receipt." },
      { property: "og:title", content: "Booking Details — Pickle Hub" },
      { property: "og:description", content: "Your Pickle Hub booking summary, payment and receipt." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <BookingPage />
    </SiteLayout>
  ),
});

function BookingPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  const { data: booking, isLoading } = useBooking(id);
  const { data: courts = [] } = useCourts();
  const { data: settings } = usePaymentSettings();
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!settings?.qr_image_path) return;
    void supabase.storage
      .from("payment-qr")
      .createSignedUrl(settings.qr_image_path, 3600)
      .then(({ data }) => setQrUrl(data?.signedUrl ?? null));
  }, [settings?.qr_image_path]);

  if (isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!booking) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-black">Booking not found</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/book">Book a court</Link>
        </Button>
      </div>
    );
  }

  const court = courts.find((c) => c.id === booking.court_id);
  const courtName = court?.name ?? `Court ${booking.court_id}`;
  // const upiLink =
  //   settings?.upi_deep_link ||
  //   `upi://pay?pa=${settings?.upi_id ?? ""}&pn=${encodeURIComponent(settings?.upi_name ?? CLUB.name)}&am=${booking.amount}&cu=INR&tn=${booking.booking_code}`;

  const refresh = () => qc.invalidateQueries({ queryKey: ["booking", id] });

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reference.trim().length < 4) { toast.error("Enter a valid UPI reference number"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("submit_booking_payment", {
      _id: booking.id,
      _reference: reference.trim(),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Payment submitted for verification");
    void refresh();
  };

  const uploadProof = async (file: File) => {
    setBusy(true);
    // const path = `${booking.user_id}/${booking.id}-${Date.now()}-${file.name.replace(/[^\w.-]/g, "")}`;
    const safeFileName = file.name.replace(/[^\w.-]/g, "");

const path = `bookings/${booking.id}/${Date.now()}-${safeFileName}`;
    const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file);
    if (upErr) {
      setBusy(false);
      toast.error(upErr.message);
      return;
    }
    const { error } = await supabase
      .from("bookings")
      .update({ payment_screenshot: path, payment_status: "PENDING_VERIFICATION" })
      .eq("id", booking.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Screenshot uploaded");
    void refresh();
  };

  const cancel = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("cancel_booking_by_id", { _id: booking.id });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Booking cancelled");
    void refresh();
  };

  const needsPayment =
    booking.status !== "CANCELLED" && booking.payment_method === "UPI_QR" && booking.payment_status === "PENDING";

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 print:w-full print:max-w-none print:px-0 print:py-0">
      <div className="print:hidden">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Booking {booking.booking_code}</p>
        <h1 className="mt-2 font-display text-3xl font-black">{courtName}</h1>
      </div>

      <Card
  className="mt-4 w-full p-6 print:mt-0 print:break-inside-avoid print:p-5"
  id="receipt"
>
  {/* Receipt Header */}
  <div className="flex flex-nowrap items-center justify-between gap-6 border-b border-border pb-4">
    <div className="flex min-w-0 flex-nowrap items-center gap-3">
      <img
        src="/favicon.png"
        alt="Pickle Hub Logo"
        className="h-12 w-12 shrink-0 object-contain print:h-10 print:w-10"
      />

      <div className="min-w-0">
        <p className="whitespace-nowrap font-display text-2xl font-black text-primary print:text-xl">
          Pickle Hub
        </p>

        <p className="whitespace-nowrap text-xs text-muted-foreground print:text-[10px]">
          {CLUB.address}
        </p>
      </div>
    </div>

    <div className="shrink-0 text-right text-xs text-muted-foreground print:text-[10px]">
      <p className="whitespace-nowrap font-bold text-foreground">
        Receipt {booking.booking_code}
      </p>

      <p className="whitespace-nowrap">
        {new Date(booking.created_at).toLocaleString("en-IN")}
      </p>
    </div>
  </div>

  {/* Booking Details */}
  <dl className="mt-5 grid grid-cols-2 gap-x-12 gap-y-5 print:mt-4 print:gap-x-10 print:gap-y-4">
    <Item
      label={booking.user_id ? "Email" : "Guest"}
      value={
        booking.user_id
          ? user?.email || "—"
          : booking.customer_name || "Guest"
      }
    />

    <Item
  label="Phone"
  value={
    booking.customer_phone ||
    profile?.phone_number ||
    "—"
  }
/>

    <Item
      label="Date"
      value={prettyDate(booking.booking_date)}
    />

    <Item
      label="Slot"
      value={slotLabel(booking.slot_hour)}
    />

    <Item
      label="Court"
      value={courtName}
    />

    <Item
      label="Players"
      value={String(booking.players)}
    />

    <Item
      label="Payment method"
      value={
        booking.payment_method === "VENUE"
          ? "Pay at venue"
          : "UPI"
      }
    />

    <Item
      label="Reference"
      value={booking.payment_reference || "—"}
    />
  </dl>

  {/* Amount and Status */}
  <div className="mt-5 flex flex-nowrap items-center justify-between gap-4 border-t border-border pt-4 print:mt-4 print:pt-3">
    <div className="flex flex-wrap gap-2">
      <Badge meta={statusMeta[booking.status]} />
      <Badge meta={paymentMeta[booking.payment_status]} />
    </div>

    <p className="shrink-0 whitespace-nowrap font-display text-3xl font-black text-primary print:text-2xl">
      {inr(booking.amount)}
    </p>
  </div>

  {/* Receipt Footer */}
  <div className="mt-5 border-t border-border pt-4 text-center print:mt-4 print:pt-3">
    <p className="text-sm font-bold print:text-xs">
      Pickle Hub
    </p>

    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground print:text-[10px]">
      {CLUB.address}
    </p>

    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground print:text-[10px]">
      Phone: {CLUB.phoneDisplay}
      {" • "}
      {CLUB.email}
    </p>

    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground print:text-[10px]">
      {CLUB.hours}
    </p>

    <p className="mt-2 text-[10px] text-muted-foreground print:text-[9px]">
      Thank you for choosing Pickle Hub. Have a great game!
    </p>
  </div>
</Card>
      {needsPayment && (
        <Card className="mt-6 p-6 print:hidden">
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
            <QrCode className="h-5 w-5 text-primary" /> Pay {inr(booking.amount)} via UPI
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{settings?.instructions}</p>

          <div className="mt-4 grid gap-5 sm:grid-cols-[180px_1fr]">
            <div className="grid place-items-center rounded-xl border border-border bg-muted/40 p-3">
              {qrUrl ? (
                <img src={qrUrl} alt="Pickle Hub UPI QR code" className="h-40 w-40 object-contain" />
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  QR not uploaded yet. Use the UPI ID below.
                </p>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-sm">
                UPI ID: <span className="font-bold">{settings?.upi_id}</span>
              </p>
              {/* <Button asChild variant="royal" size="sm">
                <a href={upiLink}>Open UPI app</a>
              </Button> */}
              <form className="space-y-2" onSubmit={submitPayment}>
                <Label htmlFor="ref">UPI reference number</Label>
                <Input id="ref" maxLength={40} value={reference} onChange={(e) => setReference(e.target.value)} />
                <Button type="submit" variant="hero" disabled={busy} className="w-full">
                  Submit payment details
                </Button>
              </form>
              <label
                htmlFor="payment-screenshot"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm font-semibold hover:bg-accent"
              >
                <Upload className="h-4 w-4" />
                Upload payment screenshot

                <input
                  id="payment-screenshot"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      void uploadProof(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </Card>
      )}

      <div className="mt-6 flex flex-wrap gap-2 print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print receipt
        </Button>
        <Button asChild variant="ghost">
          <a href={waLink(CLUB.phone, `Hi Pickle Hub, regarding booking ${booking.booking_code}`)} target="_blank" rel="noreferrer">
            WhatsApp us
          </a>
        </Button>
        {booking.status !== "CANCELLED" && (
          <Button variant="destructive" disabled={busy} onClick={() => void cancel()}>
            Cancel booking
          </Button>
        )}
        {user && (
          <Button asChild variant="ghost">
            <Link to="/activity">My activity</Link>
          </Button>
        )}
      </div>
    </section>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground print:text-[10px]">
        {label}
      </dt>

      <dd className="mt-1 whitespace-nowrap text-sm font-semibold print:text-xs">
        {value}
      </dd>
    </div>
  );
}

function Badge({ meta }: { meta?: { label: string; className: string } | undefined }) {
  if (!meta) return null;
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold", meta.className)}>{meta.label}</span>
  );
}

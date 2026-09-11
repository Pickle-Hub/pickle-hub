import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Receipt } from "lucide-react";
import { RequireAuth } from "@/components/site/RequireAuth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useCourts, useMyBookings } from "@/hooks/usePickle";
import { inr, paymentMeta, prettyDate, slotLabel, statusMeta } from "@/lib/pickle";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "My Activity — Pickle Hub" },
      { name: "description", content: "View your Pickle Hub booking history, payment status and printable receipts." },
      { property: "og:title", content: "My Activity — Pickle Hub" },
      { property: "og:description", content: "Your Pickle Hub bookings and receipts in one place." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <RequireAuth>
        <ActivityPage />
      </RequireAuth>
    </SiteLayout>
  ),
});

function ActivityPage() {
  const { user } = useAuth();
  const { data: bookings = [], isLoading } = useMyBookings(user?.id);
  const { data: courts = [] } = useCourts();
  const courtName = (id: number) => courts.find((c) => c.id === id)?.name ?? `Court ${id}`;

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-black">My Activity</h1>
      <p className="mt-2 text-sm text-muted-foreground">Every booking you've made at Pickle Hub.</p>

      {isLoading ? (
        <div className="grid h-40 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : bookings.length === 0 ? (
        <Card className="mt-8 p-10 text-center">
          <Receipt className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No bookings yet.</p>
          <Button asChild variant="hero" className="mt-5">
            <Link to="/book">Book your first slot</Link>
          </Button>
        </Card>
      ) : (
        <div className="mt-8 space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-display text-lg font-extrabold">
                  {courtName(b.court_id)} · {slotLabel(b.slot_hour)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {prettyDate(b.booking_date)} · {b.booking_code} · {b.players} players
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge meta={statusMeta[b.status]} />
                  <Badge meta={paymentMeta[b.payment_status]} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-xl font-black text-primary">{inr(b.amount)}</span>
                <Button asChild variant="outline" size="sm">
                  <Link to="/booking/$id" params={{ id: b.id }}>
                    View
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function Badge({ meta }: { meta?: { label: string; className: string } | undefined }) {
  if (!meta) return null;
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold", meta.className)}>{meta.label}</span>
  );
}

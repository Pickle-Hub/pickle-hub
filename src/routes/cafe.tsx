import { createFileRoute } from "@tanstack/react-router";
import { Coffee, Loader2, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/site/RequireAuth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useCafeItems, useCafeOrders, useMyBookings } from "@/hooks/usePickle";
import { supabase } from "@/integrations/supabase/client";
import { cafeStatusMeta, inr, prettyDate, slotLabel } from "@/lib/pickle";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cafe")({
  head: () => ({
    meta: [
      { title: "Café — Order Between Games | Pickle Hub" },
      {
        name: "description",
        content:
          "Order cold coffee, hydration drinks and snacks from the Pickle Hub café and have them ready courtside between your games.",
      },
      { property: "og:title", content: "Café — Order Between Games | Pickle Hub" },
      { property: "og:description", content: "Courtside food and drinks, ordered from your phone between games." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <SiteLayout>
      <RequireAuth>
        <CafePage />
      </RequireAuth>
    </SiteLayout>
  ),
});

function CafePage() {
  const { user, profile } = useAuth();
  const { data: items = [], isLoading } = useCafeItems();
  const { data: orders = [] } = useCafeOrders(Boolean(user));
  const { data: bookings = [] } = useMyBookings(user?.id);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [bookingId, setBookingId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const menu = items.filter((i) => i.available);
  const categories = useMemo(() => [...new Set(menu.map((i) => i.category))], [menu]);
  const cart = menu.filter((i) => (qty[i.id] ?? 0) > 0);
  const total = cart.reduce((s, i) => s + Number(i.price) * (qty[i.id] ?? 0), 0);

  const bump = (id: string, delta: number) =>
    setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) + delta) }));

  const placeOrder = async () => {
    if (!user || !cart.length) {
      toast.error("Add at least one item");
      return;
    }
    setBusy(true);
    const rows = cart.map((i) => ({
      user_id: user.id,
      booking_id: bookingId || null,
      item_id: i.id,
      item_name: i.name,
      unit_price: Number(i.price),
      quantity: qty[i.id] ?? 1,
      amount: Number(i.price) * (qty[i.id] ?? 1),
      customer_name: profile?.full_name ?? "",
      customer_phone: profile?.phone_number ?? "",
      notes: notes || null,
    }));
    const { error } = await supabase.from("cafe_orders").insert(rows);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Order sent to the café — pay at the counter when you collect.");
    setQty({});
    setNotes("");
  };

  return (
    <>
      <section className="bg-royal py-12 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Courtside café</p>
          <h1 className="mt-3 font-display text-4xl font-black sm:text-5xl">Order Between Games</h1>
          <p className="mt-3 max-w-xl text-primary-foreground/75">
            Drinks and snacks prepared while you play. Link an order to a booking and we&apos;ll have it ready when you
            step off court.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div>
          {isLoading ? (
            <div className="grid h-40 place-items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !menu.length ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              The café menu is being updated. Please check back soon.
            </Card>
          ) : (
            categories.map((cat) => (
              <div key={cat} className="mb-8">
                <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
                  <Coffee className="h-5 w-5 text-primary" /> {cat}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {menu
                    .filter((i) => i.category === cat)
                    .map((i) => (
                      <Card key={i.id} className="flex items-center gap-4 p-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{i.name}</p>
                          {i.description ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">{i.description}</p>
                          ) : null}
                          <p className="mt-2 font-display font-bold text-primary">{inr(i.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => bump(i.id, -1)} aria-label="Remove one">
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-6 text-center text-sm font-bold">{qty[i.id] ?? 0}</span>
                          <Button variant="royal" size="icon" onClick={() => bump(i.id, 1)} aria-label="Add one">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <Card className="h-fit p-5 lg:sticky lg:top-24">
            <h3 className="font-display text-lg font-extrabold">Your order</h3>
            {!cart.length ? (
              <p className="mt-3 text-sm text-muted-foreground">Pick something from the menu to get started.</p>
            ) : (
              <div className="mt-4 space-y-2 text-sm">
                {cart.map((i) => (
                  <div key={i.id} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {i.name} × {qty[i.id]}
                    </span>
                    <span className="font-semibold">{inr(Number(i.price) * (qty[i.id] ?? 0))}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-black">
                  <span>Total</span>
                  <span className="text-primary">{inr(total)}</span>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <Label>Deliver during booking (optional)</Label>
                <select
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Not linked to a booking</option>
                  {bookings
                    .filter((b) => b.status !== "CANCELLED")
                    .slice(0, 10)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {prettyDate(b.booking_date)} · {slotLabel(b.slot_hour)}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <Label>Notes for the café</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Less ice, no sugar…" />
              </div>
              <Button variant="hero" className="w-full" disabled={busy || !cart.length} onClick={() => void placeOrder()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Place order · ${inr(total)}`}
              </Button>
              <p className="text-center text-xs text-muted-foreground">Pay at the café counter on collection.</p>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-display text-lg font-extrabold">Recent orders</h3>
            {!orders.length ? (
              <p className="mt-3 text-sm text-muted-foreground">No café orders yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {orders.slice(0, 8).map((o) => {
                  const meta = cafeStatusMeta[o.status];
                  return (
                    <li key={o.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {o.item_name} × {o.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">{o.order_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{inr(o.amount)}</p>
                        <span
                          className={cn(
                            "inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold",
                            meta?.className,
                          )}
                        >
                          {meta?.label ?? o.status}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </section>
    </>
  );
}

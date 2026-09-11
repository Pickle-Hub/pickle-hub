import { BellRing, CupSoda, CalendarCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { hourLabel, inr, prettyDate } from "@/lib/pickle";

type Alert = {
  id: string;
  kind: "booking" | "cafe";
  title: string;
  detail: string;
  phone: string;
  at: string;
};

export function AdminAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const push = (a: Alert) => {
      setAlerts((prev) => [a, ...prev].slice(0, 12));
      toast.success(a.title, { description: `${a.detail} · ${a.phone}` });
    };

    const channel = supabase
      .channel("admin-live-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bookings" }, (payload) => {
        const b = payload.new as Record<string, unknown>;
        push({
          id: String(b['id']),
          kind: "booking",
          title: `New booking by ${String(b['customer_name'] || "Guest")}`,
          detail: `${prettyDate(String(b['booking_date']))} · ${hourLabel(Number(b['slot_hour']))} · Court ${String(b['court_id'])} · ${inr(Number(b['amount']))}`,
          phone: String(b['customer_phone'] || "No phone"),
          at: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cafe_orders" }, (payload) => {
        const o = payload.new as Record<string, unknown>;
        push({
          id: String(o['id']),
          kind: "cafe",
          title: `New café order by ${String(o['customer_name'] || "Player")}`,
          detail: `${String(o['quantity'])} × ${String(o['item_name'])} · ${inr(Number(o['amount']))}`,
          phone: String(o['customer_phone'] || "No phone"),
          at: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="mt-6 p-5">
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-primary" />
        <h3 className="font-display text-base font-black">Live activity</h3>
        <span className="text-xs text-muted-foreground">New bookings and café orders appear here instantly</span>
      </div>
      <div className="mt-3 space-y-2">
        {alerts.length === 0 && (
          <p className="text-sm text-muted-foreground">Waiting for new bookings and orders…</p>
        )}
        {alerts.map((a) => (
          <div key={`${a.id}-${a.at}`} className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
            {a.kind === "booking" ? (
              <CalendarCheck className="mt-0.5 h-4 w-4 text-primary" />
            ) : (
              <CupSoda className="mt-0.5 h-4 w-4 text-primary" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold">{a.title}</p>
              <p className="text-xs text-muted-foreground">
                {a.detail} · <span className="font-semibold text-foreground">{a.phone}</span>
              </p>
            </div>
            <span className="ml-auto shrink-0 text-xs text-muted-foreground">{a.at}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

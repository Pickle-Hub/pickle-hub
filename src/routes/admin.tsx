import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BadgeIndianRupee,
  CalendarRange,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Ban,
  Loader2,
  MessageCircle,
  QrCode,
  Users,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminCafe } from "@/components/site/AdminCafe";
import MembershipAdmin from "./MembershipAdmin";
import { RequireAuth } from "@/components/site/RequireAuth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useBlockedRange,
  useBookingsRange,
  useCourts,
  useCustomerCount,
  usePaymentSettings,
} from "@/hooks/usePickle";
import { supabase } from "@/integrations/supabase/client";
import type { Booking } from "@/lib/pickle";
import {
  addDays,
  confirmMessage,
  ddmmyyyy,
  hourList,
  hourLabel,
  inr,
  paymentMeta,
  prettyDate,
  reminderMessage,
  reviewMessage,
  slotLabel,
  toDateKey,
  waLink,
  weekStart,
} from "@/lib/pickle";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Pickle Hub" },
      {
        name: "description",
        content:
          "Pickle Hub staff console: revenue metrics, weekly court grid, payment verification, WhatsApp follow-ups and club settings.",
      },
      { property: "og:title", content: "Admin Dashboard — Pickle Hub" },
      { property: "og:description", content: "Manage bookings, payments and court settings at Pickle Hub." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <RequireAuth admin>
        <AdminPage />
      </RequireAuth>
    </SiteLayout>
  ),
});

function AdminPage() {
  const qc = useQueryClient();
  const [week, setWeek] = useState(() => weekStart(toDateKey(new Date())));
  const weekEnd = addDays(week, 6);

  const { data: courts = [] } = useCourts();
  const { data: bookings = [], isLoading } = useBookingsRange(week, weekEnd);
  const { data: blocked = [] } = useBlockedRange(week, weekEnd);
  const { data: customers = 0 } = useCustomerCount();
  const { data: settings } = usePaymentSettings();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(week, i)), [week]);
  const hours = hourList(courts[0]?.opening_hour ?? 5, courts[0]?.closing_hour ?? 24);

  const live = bookings.filter((b) => b.status !== "CANCELLED");
  const revenue = live.filter((b) => b.payment_status === "PAID").reduce((s, b) => s + Number(b.amount), 0);
  const pendingAmt = live
    .filter((b) => b.payment_status !== "PAID")
    .reduce((s, b) => s + Number(b.amount), 0);
  const toVerify = live.filter((b) => b.payment_status === "PENDING_VERIFICATION");
  const occupancy = Math.round((live.length / Math.max(days.length * hours.length * Math.max(courts.length, 1), 1)) * 100);

  const courtName = (id: number) => courts.find((c) => c.id === id)?.name ?? `Court ${id}`;
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["bookings-range"] });
    void qc.invalidateQueries({ queryKey: ["blocked-range"] });
    void qc.invalidateQueries({ queryKey: ["availability"] });
  };
  const setPayment = async (ids: string[], payment_status: Booking["payment_status"]) => {
    if (!ids.length) { toast.error("Select at least one booking"); return; }
    setBusy(true);
    const patch =
      payment_status === "PAID" ? { payment_status, status: "BOOKED" } : { payment_status };
    const { error } = await supabase.from("bookings").update(patch).in("id", ids);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Updated ${ids.length} booking${ids.length > 1 ? "s" : ""}`);
    setSelected([]);
    refresh();
  };

  const cancelBookings = async (ids: string[]) => {
    if (!ids.length) { toast.error("Select at least one booking"); return; }
    setBusy(true);
    const { error } = await supabase.from("bookings").update({ status: "CANCELLED" }).in("id", ids);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Bookings cancelled");
    setSelected([]);
    refresh();
  };

  const cellFor = (date: string, hour: number, courtId: number) => {
    const b = live.find((x) => x.booking_date === date && x.slot_hour === hour && x.court_id === courtId);
    if (b) return { b, kind: b.payment_status === "PAID" ? "paid" : "pending" } as const;
    const bl = blocked.find(
      (x) => x.blocked_date === date && (x.slot_hour === null || x.slot_hour === hour) && (x.court_id === null || x.court_id === courtId),
    );
    if (bl) return { b: null, kind: "blocked" } as const;
    return { b: null, kind: "free" } as const;
  };

  const exportCsv = () => {
    const rows = [
      ["Booking", "Date", "Slot", "Court", "Customer", "Phone", "Players", "Amount", "Status", "Payment", "Reference"],
      ...bookings.map((b) => [
        b.booking_code,
        ddmmyyyy(b.booking_date),
        slotLabel(b.slot_hour),
        courtName(b.court_id),
        b.customer_name,
        b.customer_phone,
        String(b.players),
        String(b.amount),
        b.status,
        b.payment_status,
        b.payment_reference ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `pickle-hub-${week}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Staff console</p>
          <h1 className="mt-2 font-display text-3xl font-black sm:text-4xl">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Previous week" onClick={() => setWeek(addDays(week, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold">
            {prettyDate(week)} → {prettyDate(weekEnd)}
          </span>
          <Button variant="outline" size="icon" aria-label="Next week" onClick={() => setWeek(addDays(week, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="royal" onClick={exportCsv}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={BadgeIndianRupee} label="Revenue collected" value={inr(revenue)} hint="This week, verified" />
        <Metric icon={CalendarRange} label="Bookings" value={String(live.length)} hint={`${occupancy}% slot occupancy`} />
        <Metric icon={CheckCheck} label="Awaiting verification" value={String(toVerify.length)} hint={inr(pendingAmt) + " outstanding"} />
        <Metric icon={Users} label="Registered players" value={String(customers)} hint="All time" />
      </div>

      <Tabs defaultValue="grid" className="mt-10">
        <TabsList>
          <TabsTrigger value="grid">Weekly grid</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="membership">Membership</TabsTrigger>
          <TabsTrigger value="cafe">Café</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>


        {/* EXCEL-STYLE GRID */}
        <TabsContent value="grid" className="mt-6">
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/70">
                    <th className="sticky left-0 z-10 border border-border bg-muted/70 px-3 py-2 text-left font-bold">Slot</th>
                    {days.map((d) => (
                      <th key={d} colSpan={Math.max(courts.length, 1)} className="border border-border px-3 py-2 font-bold">
                        {prettyDate(d)}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-muted/40">
                    <th className="sticky left-0 z-10 border border-border bg-muted/40 px-3 py-1.5 text-left font-semibold text-muted-foreground">
                      Court →
                    </th>
                    {days.flatMap((d) =>
                      (courts.length ? courts : [{ id: 1, name: "Court 1" }]).map((c) => (
                        <th key={`${d}-${c.id}`} className="border border-border px-2 py-1.5 font-semibold text-muted-foreground">
                          {c.name}
                        </th>
                      )),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {hours.map((h) => (
                    <tr key={h} className="hover:bg-accent/40">
                      <td className="sticky left-0 z-10 border border-border bg-card px-3 py-1.5 font-semibold">
                        {hourLabel(h)}
                      </td>
                      {days.flatMap((d) =>
                        (courts.length ? courts : [{ id: 1, name: "Court 1" }]).map((c) => {
                          const cell = cellFor(d, h, c.id);
                          return (
                            <td
                              key={`${d}-${c.id}-${h}`}
                              title={cell.b ? `${cell.b.booking_code} · ${cell.b.customer_name}` : ""}
                              className={cn(
                                "border border-border px-2 py-1.5 text-center",
                                cell.kind === "paid" && "bg-success/15 font-semibold text-success",
                                cell.kind === "pending" && "bg-warning/20 font-semibold",
                                cell.kind === "blocked" && "bg-muted text-muted-foreground",
                              )}
                            >
                              {cell.kind === "free"
                                ? "—"
                                : cell.kind === "blocked"
                                  ? "Blocked"
                                  : `${cell.b!.customer_name?.split(" ")[0] || cell.b!.booking_code} · ${inr(cell.b!.amount)}`}
                            </td>
                          );
                        }),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <Legend className="bg-success/15" label="Paid" />
            <Legend className="bg-warning/20" label="Payment pending" />
            <Legend className="bg-muted" label="Blocked" />
          </div>
          <BlockSlotForm courts={courts} onDone={refresh} />
        </TabsContent>

        {/* TRANSACTIONS */}
        <TabsContent value="transactions" className="mt-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{selected.length} selected</span>
            <Button size="sm" variant="royal" disabled={busy} onClick={() => void setPayment(selected, "PAID")}>
              Mark paid
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void setPayment(selected, "REJECTED")}>
              Reject payment
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void cancelBookings(selected)}>
              Cancel bookings
            </Button>
            {busy && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>

          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3">
                      <Checkbox
                        checked={selected.length > 0 && selected.length === bookings.length}
                        onCheckedChange={(v) => setSelected(v ? bookings.map((b) => b.id) : [])}
                        aria-label="Select all"
                      />
                    </th>
                    {["Booking", "Date", "Slot", "Court", "Customer", "Amount", "Payment", "WhatsApp"].map((h) => (
                      <th key={h} className="px-3 py-3 text-left font-bold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={9} className="px-3 py-10 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                      </td>
                    </tr>
                  )}
                  {!isLoading && bookings.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                        No bookings this week.
                      </td>
                    </tr>
                  )}
                  {bookings.map((b) => {
                    const meta = paymentMeta[b.payment_status];
                    return (
                      <tr key={b.id} className="border-t border-border hover:bg-accent/40">
                        <td className="px-3 py-2.5">
                          <Checkbox
                            checked={selected.includes(b.id)}
                            onCheckedChange={(v) =>
                              setSelected((s) => (v ? [...s, b.id] : s.filter((x) => x !== b.id)))
                            }
                            aria-label={`Select ${b.booking_code}`}
                          />
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs font-bold">{b.booking_code}</td>
                        <td className="px-3 py-2.5">{ddmmyyyy(b.booking_date)}</td>
                        <td className="px-3 py-2.5">{slotLabel(b.slot_hour)}</td>
                        <td className="px-3 py-2.5">{courtName(b.court_id)}</td>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold">{b.customer_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{b.customer_phone}</p>
                        </td>
                        <td className="px-3 py-2.5 font-semibold">{inr(b.amount)}</td>
                        <td className="px-3 py-2.5">
                          <span className={cn("rounded-full border px-2.5 py-1 text-xs font-bold", meta?.className)}>
                            {b.status === "CANCELLED" ? "Cancelled" : meta?.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex gap-1.5">
                            <WaBtn href={waLink(b.customer_phone, confirmMessage(b, courtName(b.court_id)))} label="Confirm" />
                            <WaBtn href={waLink(b.customer_phone, reminderMessage(b, courtName(b.court_id)))} label="Remind" />
                            <WaBtn href={waLink(b.customer_phone, reviewMessage(b, courtName(b.court_id)))} label="Review" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        {/* MEMBERSHIP */}
        <TabsContent value="membership" className="mt-6">
          <MembershipAdmin courts={courts} />
        </TabsContent>

        {/* CAFÉ */}
        <TabsContent value="cafe" className="mt-6">
          <AdminCafe />
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="mt-6 grid gap-6 lg:grid-cols-2">
          <CourtSettings courts={courts} />
          <PaymentSettingsCard settings={settings} />
        </TabsContent>
      </Tabs>

    </section>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="p-6 shadow-soft">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-royal text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn("h-3 w-5 rounded border border-border", className)} /> {label}
    </span>
  );
}

function WaBtn({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild size="sm" variant="outline" className="h-8 px-2 text-xs">
      <a href={href} target="_blank" rel="noreferrer">
        <MessageCircle className="h-3.5 w-3.5" /> {label}
      </a>
    </Button>
  );
}

function BlockSlotForm({ courts, onDone }: { courts: { id: number; name: string }[]; onDone: () => void }) {
  const [date, setDate] = useState(toDateKey(new Date()));
  const [hour, setHour] = useState("");
  const [courtId, setCourtId] = useState("");
  const [reason, setReason] = useState("Maintenance");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("blocked_slots").insert({
      blocked_date: date,
      slot_hour: hour === "" ? null : Number(hour),
      court_id: courtId === "" ? null : Number(courtId),
      reason,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Slot blocked");
    onDone();
  };

  return (
    <Card className="mt-6 p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
        <Ban className="h-5 w-5 text-primary" /> Block a slot
      </h2>
      <form className="mt-4 grid gap-3 sm:grid-cols-5" onSubmit={submit}>
        <div>
          <Label htmlFor="bdate">Date</Label>
          <Input id="bdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="bhour">Hour (blank = all day)</Label>
          <select
            id="bhour"
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={hour}
            onChange={(e) => setHour(e.target.value)}
          >
            <option value="">Whole day</option>
            {hourList().map((h) => (
              <option key={h} value={h}>
                {slotLabel(h)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="bcourt">Court</Label>
          <select
            id="bcourt"
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={courtId}
            onChange={(e) => setCourtId(e.target.value)}
          >
            <option value="">All courts</option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="breason">Reason</Label>
          <Input id="breason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button type="submit" variant="hero" disabled={busy} className="w-full">
            Block
          </Button>
        </div>
      </form>
    </Card>
  );
}

function CourtSettings({ courts }: { courts: { id: number; name: string; day_rate: number; evening_rate: number; evening_start_hour: number }[] }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const save = async (id: number, form: HTMLFormElement) => {
    const fd = new FormData(form);
    setBusy(true);
    const { error } = await supabase
      .from("courts")
      .update({
        name: String(fd.get("name")),
        day_rate: Number(fd.get("day_rate")),
        evening_rate: Number(fd.get("evening_rate")),
        evening_start_hour: Number(fd.get("evening_start_hour")),
      })
      .eq("id", id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Court updated");
    void qc.invalidateQueries({ queryKey: ["courts"] });
  };

  return (
    <Card className="p-6">
      <h2 className="font-display text-lg font-extrabold">Court settings</h2>
      <div className="mt-4 space-y-6">
        {courts.map((c) => (
          <form
            key={c.id}
            className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              void save(c.id, e.currentTarget);
            }}
          >
            <div className="sm:col-span-2">
              <Label>Name</Label>
              <Input name="name" defaultValue={c.name} />
            </div>
            <div>
              <Label>Day rate (₹)</Label>
              <Input name="day_rate" type="number" min={0} defaultValue={Number(c.day_rate)} />
            </div>
            <div>
              <Label>Evening rate (₹)</Label>
              <Input name="evening_rate" type="number" min={0} defaultValue={Number(c.evening_rate)} />
            </div>
            <div>
              <Label>Evening starts (hour)</Label>
              <Input name="evening_start_hour" type="number" min={0} max={23} defaultValue={c.evening_start_hour} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" variant="royal" disabled={busy} className="w-full">
                Save {c.name}
              </Button>
            </div>
          </form>
        ))}
      </div>
    </Card>
  );
}

function PaymentSettingsCard({ settings }: { settings: { upi_id: string; upi_name: string; instructions: string; qr_image_path: string | null } | null | undefined }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const save = async (form: HTMLFormElement) => {
    const fd = new FormData(form);
    setBusy(true);
    const { error } = await supabase
      .from("payment_settings")
      .update({
        upi_id: String(fd.get("upi_id")),
        upi_name: String(fd.get("upi_name")),
        instructions: String(fd.get("instructions")),
      })
      .eq("id", true);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Payment settings saved");
    void qc.invalidateQueries({ queryKey: ["payment_settings"] });
  };

  const uploadQr = async (file: File) => {
    setBusy(true);
    const path = `qr/${Date.now()}-${file.name.replace(/[^\w.-]/g, "")}`;
    const { error: upErr } = await supabase.storage.from("payment-qr").upload(path, file, { upsert: true });
    if (upErr) {
      setBusy(false);
      { toast.error(upErr.message); return; }
    }
    const { error } = await supabase.from("payment_settings").update({ qr_image_path: path }).eq("id", true);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("QR code updated");
    void qc.invalidateQueries({ queryKey: ["payment_settings"] });
  };

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
        <QrCode className="h-5 w-5 text-primary" /> Payment settings
      </h2>
      <form
        className="mt-4 grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void save(e.currentTarget);
        }}
      >
        <div>
          <Label>UPI ID</Label>
          <Input name="upi_id" defaultValue={settings?.upi_id ?? ""} placeholder="picklehub@upi" />
        </div>
        <div>
          <Label>Payee name</Label>
          <Input name="upi_name" defaultValue={settings?.upi_name ?? ""} />
        </div>
        <div>
          <Label>Instructions shown to customers</Label>
          <Textarea name="instructions" rows={3} defaultValue={settings?.instructions ?? ""} />
        </div>
        <Button type="submit" variant="royal" disabled={busy}>
          Save payment settings
        </Button>
      </form>
      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3 py-3 text-sm font-semibold hover:bg-accent">
        <QrCode className="h-4 w-4" />
        {settings?.qr_image_path ? "Replace UPI QR image" : "Upload UPI QR image"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadQr(f);
          }}
        />
      </label>
    </Card>
  );
}
export default MembershipAdmin;
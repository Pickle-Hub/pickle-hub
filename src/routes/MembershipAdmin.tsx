import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarDays, Check, Edit3, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const db = supabase as any;

type MembershipAdminProps = {
  courts: { id: number; name: string }[];
};

type Membership = {
  id: string;
  user_id: string | null;
  plan_id?: string | null;
  member_name: string | null;
  member_phone?: string | null;
  card_number: string | null;
  total_hours: number | null;
  used_hours: number | null;
  valid_from: string | null;
  valid_until: string | null;
  status: string | null;
  membership_plans?: {
    name?: string | null;
    restriction?: string | null;
    rate_per_hour?: number | null;
  } | null;
};

type Booking = {
  id: string;
  booking_code?: string | null;
  user_id: string | null;
  booking_date: string;
  slot_hour: number;
  court_id: number;
  status: string | null;
};

type Usage = {
  id: string;
  membership_id: string;
  booking_id: string | null;
  slot_number: number | null;
  usage_date: string;
  slot_hour: number;
  court_id: number;
  hours: number;
  status: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function slotLabel(hour: number) {
  const start = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const startSuffix = hour >= 12 ? "PM" : "AM";
  const endHour = hour + 1;
  const end = endHour === 24 ? 12 : endHour > 12 ? endHour - 12 : endHour;
  const endSuffix = endHour >= 12 && endHour < 24 ? "PM" : "AM";
  return `${start} ${startSuffix} – ${end} ${endSuffix}`;
}

export function MembershipAdmin({ courts }: MembershipAdminProps) {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [marking, setMarking] = useState(false);

  const {
  data: memberships = [],
  isLoading,
  isError,
  error: membershipsError,
} = useQuery<Membership[]>({
  queryKey: ["admin-memberships"],

  queryFn: async () => {
    // 1. Fetch memberships
    const {
      data: membershipData,
      error: membershipError,
    } = await db
      .from("memberships")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (membershipError) {
      console.error(
        "ADMIN MEMBERSHIPS ERROR:",
        membershipError,
      );

      throw membershipError;
    }

    console.log(
      "ADMIN MEMBERSHIPS FROM DB:",
      membershipData,
    );

    if (!membershipData || membershipData.length === 0) {
      return [];
    }

    // 2. Get the plan IDs used by memberships
    const planIds = [
      ...new Set(
        (membershipData as Membership[])
          .map((membership: Membership) => membership.plan_id)
          .filter(Boolean),
      ),
    ];

    console.log(
      "ADMIN PLAN IDS:",
      planIds,
    );

    // 3. Fetch the plans
    let plansData: any[] = [];

    if (planIds.length > 0) {
      const {
        data,
        error: plansError,
      } = await db
        .from("membership_plans")
        .select("*")
        .in("id", planIds);

      if (plansError) {
        console.error(
          "ADMIN PLANS ERROR:",
          plansError,
        );

        throw plansError;
      }

      plansData = data ?? [];
    }

    console.log(
      "ADMIN PLANS FROM DB:",
      plansData,
    );

    // 4. Attach the correct plan to each membership
    const finalMemberships = (membershipData as Membership[]).map(
      (membership: Membership) => {
        const plan =
          plansData.find(
            (plan: any) => plan.id === membership.plan_id,
          ) ?? null;

        return {
          ...membership,
          membership_plans: plan,
        };
      },
    );

    console.log(
      "ADMIN FINAL MEMBERSHIPS:",
      finalMemberships,
    );

    return finalMemberships as Membership[];
  },
});

  const selected = useMemo(
    () => memberships.find((m) => m.id === selectedId) ?? null,
    [memberships, selectedId],
  );

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["admin-membership-bookings", selected?.user_id],
    enabled: Boolean(selected?.user_id),
    queryFn: async () => {
      const { data, error } = await db
        .from("bookings")
        .select("id, booking_code, user_id, booking_date, slot_hour, court_id, status")
        .eq("user_id", selected!.user_id)
        .order("booking_date", { ascending: false })
        .order("slot_hour", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Booking[];
    },
  });

  const { data: usage = [], isLoading: usageLoading } = useQuery<Usage[]>({
    queryKey: ["admin-membership-usage", selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => {
      const { data, error } = await db
        .from("membership_usage")
        .select("*")
        .eq("membership_id", selectedId)
        .order("usage_date", { ascending: false })
        .order("slot_hour", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Usage[];
    },
  });

  const [form, setForm] = useState({
    member_name: "",
    member_phone: "",
    card_number: "",
    valid_from: "",
    valid_until: "",
    status: "PENDING",
    total_hours: "",
  });

  const openMembership = (m: Membership) => {
    setSelectedId(m.id);
    setEditing(false);
    setForm({
      member_name: m.member_name ?? "",
      member_phone: m.member_phone ?? "",
      card_number: m.card_number ?? "",
      valid_from: m.valid_from ?? "",
      valid_until: m.valid_until ?? "",
      status: m.status ?? "PENDING",
      total_hours: String(m.total_hours ?? ""),
    });
  };

  const saveMembership = async () => {
    if (!selected) return;

    if (form.member_name.trim().length < 2) {
      toast.error("Enter the member name.");
      return;
    }

    if (!form.valid_from || !form.valid_until) {
      toast.error("Enter both validity dates.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await db
        .from("memberships")
        .update({
          member_name: form.member_name.trim(),
          member_phone: form.member_phone.trim() || null,
          card_number: form.card_number.trim() || null,
          valid_from: form.valid_from,
          valid_until: form.valid_until,
          status: form.status,
          total_hours: Number(form.total_hours || 0),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selected.id);

      if (error) throw error;

      toast.success("Membership updated.");
      setEditing(false);

      await qc.invalidateQueries({ queryKey: ["admin-memberships"] });
      await qc.invalidateQueries({ queryKey: ["my-membership"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update membership.");
    } finally {
      setSaving(false);
    }
  };

  const markBookingUsed = async (booking: Booking) => {
    if (!selected) return;

    const total = Number(selected.total_hours ?? 0);
    const used = Number(selected.used_hours ?? 0);

    if (selected.status !== "ACTIVE") {
      toast.error("Activate the membership before marking a booking as used.");
      return;
    }

    if (used >= total) {
      toast.error("No membership hours remain.");
      return;
    }

    if (booking.status?.toUpperCase() === "CANCELLED") {
      toast.error("Cancelled bookings cannot consume membership hours.");
      return;
    }

    setMarking(true);

    try {
      const { data: existing, error: existingError } = await db
        .from("membership_usage")
        .select("id")
        .eq("membership_id", selected.id)
        .eq("booking_id", booking.id)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        toast.error("This booking is already marked as used.");
        return;
      }

      const {
        data: { user: adminUser },
      } = await supabase.auth.getUser();

      if (!adminUser) {
        throw new Error("Admin session not found.");
      }

      const { error: usageError } = await db
        .from("membership_usage")
        .insert({
          membership_id: selected.id,
          booking_id: booking.id,
          usage_date: booking.booking_date,
          slot_hour: booking.slot_hour,
          court_id: booking.court_id,
          hours: 1,
          marked_by: adminUser.id,
          status: "USED",
        });

      if (usageError) throw usageError;

      const { error: updateError } = await db
        .from("memberships")
        .update({
          used_hours: used + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selected.id);

      if (updateError) throw updateError;

      toast.success("Booking marked as membership usage.");

      await qc.invalidateQueries({ queryKey: ["admin-memberships"] });
      await qc.invalidateQueries({ queryKey: ["admin-membership-usage", selected.id] });
      await qc.invalidateQueries({ queryKey: ["my-membership"] });
      await qc.invalidateQueries({ queryKey: ["my-membership-usage"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not mark booking as used.");
    } finally {
      setMarking(false);
    }
  };

  const toggleMembershipSlot = async (slotNumber: number) => {
  if (!selected) return;

  const total = Number(selected.total_hours ?? 0);
  const used = Number(selected.used_hours ?? 0);

  if (slotNumber > total) {
    return;
  }

  if (selected.status !== "ACTIVE") {
    toast.error("Activate the membership before marking slots.");
    return;
  }

  const existingSlot = usage.find(
    (item) => Number(item.slot_number) === slotNumber,
  );

  setMarking(true);

  try {
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser();

    if (!adminUser) {
      throw new Error("Admin session not found.");
    }

    // ============================================
    // CLICKED SLOT IS ALREADY COMPLETED
    // → REMOVE THE TICK
    // ============================================
    if (existingSlot) {
      const { error: deleteError } = await db
        .from("membership_usage")
        .delete()
        .eq("id", existingSlot.id);

      if (deleteError) throw deleteError;

      const newUsedHours = Math.max(used - 1, 0);

      const { error: updateError } = await db
        .from("memberships")
        .update({
          used_hours: newUsedHours,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selected.id);

      if (updateError) throw updateError;

      toast.success(`Slot ${slotNumber} marked as open.`);
    }

    // ============================================
    // CLICKED SLOT IS EMPTY
    // → ADD THE TICK
    // ============================================
    else {
      if (used >= total) {
        toast.error("All membership hours are already completed.");
        return;
      }

      const { error: insertError } = await db
        .from("membership_usage")
        .insert({
          membership_id: selected.id,
          booking_id: null,
          slot_number: slotNumber,
          usage_date: new Date().toISOString().slice(0, 10),
          slot_hour: 0,
          court_id: 1,
          hours: 1,
          marked_by: adminUser.id,
          status: "USED",
        });

      if (insertError) throw insertError;

      const { error: updateError } = await db
        .from("memberships")
        .update({
          used_hours: used + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selected.id);

      if (updateError) throw updateError;

      toast.success(`Slot ${slotNumber} completed.`);
    }

    await qc.invalidateQueries({
      queryKey: ["admin-memberships"],
    });

    await qc.invalidateQueries({
      queryKey: ["admin-membership-usage", selected.id],
    });

    await qc.invalidateQueries({
      queryKey: ["my-membership", selected.user_id],
    });

    await qc.invalidateQueries({
      queryKey: ["my-membership-usage", selected.id],
    });
  } catch (error) {
    console.error("Membership slot toggle error:", error);

    toast.error(
      error instanceof Error
        ? error.message
        : "Could not update membership slot.",
    );
  } finally {
    setMarking(false);
  }
};

  const courtName = (id: number) =>
    courts.find((c) => c.id === id)?.name ?? `Court ${id}`;

  if (isLoading) {
  return (
    <Card className="p-10 text-center">
      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
      <p className="mt-3 text-sm text-muted-foreground">
        Loading memberships...
      </p>
    </Card>
  );
}

if (isError) {
  return (
    <Card className="border-red-200 bg-red-50 p-10 text-center">
      <p className="font-bold text-red-700">
        Unable to load memberships.
      </p>

      <p className="mt-2 text-sm text-red-600">
        {membershipsError instanceof Error
          ? membershipsError.message
          : "Please check the memberships table permissions and relationship."}
      </p>
    </Card>
  );
}

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Membership
        </p>
        <h2 className="mt-2 font-display text-2xl font-black">
          Membership Management
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View, edit, activate and track every member. Only admin can mark booking hours as used.
        </p>
      </div>

      {/* PURPLE / YELLOW MEMBERSHIP TABLE */}
      <Card className="overflow-hidden border-purple-200 p-0 shadow-sm">
        <div className="bg-purple-950 px-5 py-4 text-white">
          <h3 className="text-lg font-black">Pickleball Membership Register</h3>
          <p className="mt-1 text-sm text-white/75">
            Member details, validity, hours and current status
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] text-sm">
            <thead className="bg-purple-50 text-purple-950">
              <tr>
                {[
                  "Member",
                  "Plan",
                  "Card",
                  "Validity",
                  "Total",
                  "Used",
                  "Remaining",
                  "Status",
                  "Action",
                ].map((heading) => (
                  <th key={heading} className="border-b border-purple-100 px-4 py-3 text-left font-black">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {memberships.map((m) => {
                const total = Number(m.total_hours ?? 0);
                const used = Number(m.used_hours ?? 0);
                const remaining = Math.max(total - used, 0);

                return (
                  <tr
                    key={m.id}
                    className={selectedId === m.id ? "border-t bg-yellow-50" : "border-t"}
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold">{m.member_name || "Member"}</p>
                      <p className="text-xs text-muted-foreground">{m.member_phone || "—"}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {m.membership_plans?.name ?? "Membership"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {m.card_number || "Not assigned"}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(m.valid_from)} → {formatDate(m.valid_until)}
                    </td>
                    <td className="px-4 py-3 font-bold">{total} hrs</td>
                    <td className="px-4 py-3 font-bold">{used} hrs</td>
                    <td className="px-4 py-3 font-black text-purple-800">{remaining} hrs</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-black ${
                          m.status === "ACTIVE"
                            ? "border-green-300 bg-green-50 text-green-700"
                            : m.status === "PENDING"
                              ? "border-yellow-300 bg-yellow-50 text-yellow-800"
                              : "border-gray-200 bg-gray-50 text-gray-600"
                        }`}
                      >
                        {m.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => openMembership(m)}>
                        Manage
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {memberships.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    No membership requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && (
        <Card className="overflow-hidden border-purple-200 p-0">
          {/* CARD-STYLE ADMIN VIEW */}
          <div className="bg-purple-950 px-6 py-5 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-300">
                  Pickle Hub
                </p>
                <h3 className="mt-1 text-2xl font-black">Pickleball Membership Card</h3>
                <p className="mt-1 text-sm text-white/75">
                  {selected.membership_plans?.name ?? "Membership"}
                </p>
              </div>

              <Button
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
                onClick={() => setSelectedId("")}
              >
                <X className="mr-2 h-4 w-4" />
                Close
              </Button>
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1.3fr]">
            <div className="rounded-3xl bg-gradient-to-br from-purple-900 via-purple-800 to-fuchsia-800 p-6 text-white shadow-lg">
              <div className="rounded-2xl border-2 border-white/80 p-5">
                <p className="text-center text-lg font-black tracking-wide">
                  PICKLEBALL MEMBERSHIP CARD
                </p>

                <div className="mt-6 rounded-xl bg-white/10 p-4">
                  <p className="text-xs font-bold uppercase text-yellow-300">Member Name</p>
                  <p className="mt-1 text-xl font-black">{selected.member_name || "—"}</p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 p-4">
                    <p className="text-xs font-bold uppercase text-yellow-300">Card No.</p>
                    <p className="mt-1 font-black">{selected.card_number || "Pending"}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-4">
                    <p className="text-xs font-bold uppercase text-yellow-300">Status</p>
                    <p className="mt-1 font-black">{selected.status || "—"}</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white/10 p-3">
                    <p className="text-xs text-white/70">Total</p>
                    <p className="text-lg font-black">{Number(selected.total_hours ?? 0)}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3">
                    <p className="text-xs text-white/70">Used</p>
                    <p className="text-lg font-black">{Number(selected.used_hours ?? 0)}</p>
                  </div>
                  <div className="rounded-xl bg-yellow-300 p-3 text-purple-950">
                    <p className="text-xs">Remaining</p>
                    <p className="text-lg font-black">
                      {Math.max(
                        Number(selected.total_hours ?? 0) -
                          Number(selected.used_hours ?? 0),
                        0,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-white/70">Valid From</p>
                    <p className="font-bold">{formatDate(selected.valid_from)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/70">Valid Until</p>
                    <p className="font-bold">{formatDate(selected.valid_until)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    Admin Controls
                  </p>
                  <h4 className="mt-1 text-xl font-black">Edit Membership</h4>
                </div>

                {!editing && (
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>

              {editing ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Member Name</Label>
                    <Input
                      value={form.member_name}
                      onChange={(e) => setForm((f) => ({ ...f, member_name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={form.member_phone}
                      onChange={(e) => setForm((f) => ({ ...f, member_phone: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Card Number</Label>
                    <Input
                      value={form.card_number}
                      onChange={(e) => setForm((f) => ({ ...f, card_number: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Total Hours</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.total_hours}
                      onChange={(e) => setForm((f) => ({ ...f, total_hours: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Status</Label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="EXPIRED">EXPIRED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                  <div>
                    <Label>Valid From</Label>
                    <Input
                      type="date"
                      value={form.valid_from}
                      onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Valid Until</Label>
                    <Input
                      type="date"
                      value={form.valid_until}
                      onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                    />
                  </div>

                  <div className="flex gap-2 sm:col-span-2">
                    <Button variant="royal" disabled={saving} onClick={() => void saveMembership()}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save
                    </Button>
                    <Button variant="outline" disabled={saving} onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border bg-muted/30 p-5 text-sm">
                  <p><strong>Member:</strong> {selected.member_name || "—"}</p>
                  <p className="mt-1"><strong>Phone:</strong> {selected.member_phone || "—"}</p>
                  <p className="mt-1"><strong>Card:</strong> {selected.card_number || "Not assigned"}</p>
                  <p className="mt-1"><strong>Validity:</strong> {formatDate(selected.valid_from)} → {formatDate(selected.valid_until)}</p>
                  <p className="mt-1"><strong>Status:</strong> {selected.status || "—"}</p>
                </div>
              )}
            </div>
          </div>

          {/* ================================================= */}
{/* CLICKABLE MEMBERSHIP CARD SLOTS */}
{/* ================================================= */}

<div className="border-t bg-purple-50 p-6">
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-800">
        Booking Slots
      </p>

      <h4 className="mt-1 text-xl font-black text-purple-950">
        Membership Attendance
      </h4>

      <p className="mt-1 text-sm text-muted-foreground">
        Click a slot to mark it completed. Click again to remove the tick.
      </p>
    </div>

    <div className="rounded-full bg-yellow-300 px-4 py-2 text-sm font-black text-purple-950">
      {usage.filter((item) => item.status === "USED").length} /{" "}
      {Number(selected.total_hours ?? 0)} completed
    </div>
  </div>

  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
    {Array.from(
      {
        length:
          Number(selected.total_hours ?? 0) === 10
            ? 10
            : 20,
      },
      (_, index) => {
        const slotNumber = index + 1;

        const completed = usage.some(
          (item) =>
            Number(item.slot_number) === slotNumber &&
            item.status === "USED",
        );

        return (
          <button
            key={slotNumber}
            type="button"
            disabled={marking}
            onClick={() =>
              void toggleMembershipSlot(slotNumber)
            }
            className={`relative flex aspect-[1.5] items-center justify-center rounded-xl border-2 font-black transition-all duration-200 ${
              completed
                ? "border-green-600 bg-green-500 text-white shadow-md"
                : "border-purple-300 bg-white text-purple-950 hover:border-purple-600 hover:bg-purple-50"
            } ${
              marking
                ? "cursor-wait opacity-70"
                : "cursor-pointer"
            }`}
          >
            {completed ? (
              <div className="flex flex-col items-center">
                <Check className="h-8 w-8 stroke-[4]" />

                <span className="text-xs">
                  COMPLETED
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-lg">
                  {slotNumber}
                </span>

                <span className="text-[10px] text-purple-500">
                  OPEN
                </span>
              </div>
            )}
          </button>
        );
      },
    )}
  </div>
</div>

          {/* MEMBER BOOKINGS */}
          <div className="border-t p-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h4 className="text-xl font-black">Member Bookings</h4>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Choose a booking and mark one hour as used. This is an admin-only action.
            </p>

            <div className="mt-5 overflow-x-auto rounded-2xl border">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-4 py-3 text-left">Booking</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Slot</th>
                    <th className="px-4 py-3 text-left">Court</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsLoading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                      </td>
                    </tr>
                  )}

                  {!bookingsLoading &&
                    bookings.map((booking) => {
                      const alreadyUsed = usage.some((u) => u.booking_id === booking.id);
                      const cancelled = booking.status?.toUpperCase() === "CANCELLED";

                      return (
                        <tr key={booking.id} className="border-t">
                          <td className="px-4 py-3 font-mono text-xs font-bold">
                            {booking.booking_code || booking.id.slice(0, 8)}
                          </td>
                          <td className="px-4 py-3">{formatDate(booking.booking_date)}</td>
                          <td className="px-4 py-3">{slotLabel(booking.slot_hour)}</td>
                          <td className="px-4 py-3">{courtName(booking.court_id)}</td>
                          <td className="px-4 py-3">{booking.status || "—"}</td>
                          <td className="px-4 py-3">
                            {alreadyUsed ? (
                              <span className="text-xs font-bold text-green-700">Already used</span>
                            ) : (
                              <Button
                                size="sm"
                                variant="royal"
                                disabled={
                                  marking ||
                                  cancelled ||
                                  selected.status !== "ACTIVE" ||
                                  Number(selected.used_hours ?? 0) >= Number(selected.total_hours ?? 0)
                                }
                                onClick={() => void markBookingUsed(booking)}
                              >
                                {marking ? "Marking..." : "Mark as Used"}
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                  {!bookingsLoading && bookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                        No bookings found for this member.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {usageLoading && (
              <p className="mt-3 text-xs text-muted-foreground">Loading usage history...</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
export default MembershipAdmin;

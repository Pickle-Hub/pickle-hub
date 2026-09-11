import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";

const db = supabase as any;

export const Route = createFileRoute("/membership")({
  head: () => ({
    meta: [
      {
        title: "Membership — Pickle Hub",
      },
      {
        name: "description",
        content:
          "Choose a Pickle Hub membership and track your membership hours.",
      },
    ],
  }),
  component: MembershipPage,
});

type Plan = {
  id: string;
  name: string;
  description: string | null;
  total_hours: number;
  rate_per_hour: number;
  restriction: string | null;
  active: boolean;
};

type Membership = {
  id: string;
  user_id: string | null;
  plan_id: string | null;
  member_name: string | null;
  member_phone: string | null;
  card_number: string | null;
  total_hours: number | null;
  used_hours: number | null;
  valid_from: string | null;
  valid_until: string | null;
  status: string | null;

  membership_plans?: {
    name?: string | null;
    description?: string | null;
    total_hours?: number | null;
    rate_per_hour?: number | null;
    restriction?: string | null;
  } | null;
};

type Usage = {
  id: string;
  booking_id: string | null;
  slot_number: number | null;
  usage_date: string;
  slot_hour: number;
  court_id: number;
  hours: number;
  status: string | null;

  courts?: {
    name?: string | null;
  } | null;
};

function dateText(value: string | null | undefined) {
  if (!value) return "Pending admin activation";

  const d = new Date(`${value}T00:00:00`);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleDateString("en-IN");
}

function slotText(hour: number) {
  const start = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const startSuffix = hour >= 12 ? "PM" : "AM";

  const endHour = hour + 1;

  const end =
    endHour === 24 ? 12 : endHour > 12 ? endHour - 12 : endHour;

  const endSuffix =
    endHour >= 12 && endHour < 24 ? "PM" : "AM";

  return `${start} ${startSuffix} – ${end} ${endSuffix}`;
}

function MembershipPage() {
  const { user, profile } = useAuth();

  const queryClient = useQueryClient();

  /*
   * This is the important fix.
   *
   * Only the plan that the user actually clicks is selected.
   * The other three buttons/cards remain unselected.
   */
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    null,
  );

  /*
   * Load all active membership plans.
   */
  const {
    data: plans = [],
    isLoading: plansLoading,
    isError: plansError,
  } = useQuery<Plan[]>({
    queryKey: ["membership-plans"],

    queryFn: async () => {
      const { data, error } = await db
        .from("membership_plans")
        .select("*")
        .eq("active", true)
        .order("rate_per_hour", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      return (data ?? []) as Plan[];
    },
  });

  /*
   * Load the currently logged-in user's membership.
   */
  
  /*
 * Load the currently logged-in user's membership.
 */
const {
  data: membership = null,
  isLoading: membershipLoading,
  isError: membershipError,
} = useQuery<Membership | null>({
  queryKey: ["my-membership", user?.id],

  enabled: Boolean(user?.id),

  queryFn: async () => {
    if (!user?.id) {
      return null;
    }

    // 1. Fetch membership from memberships table
    const {
      data: membershipData,
      error: membershipFetchError,
    } = await db
      .from("memberships")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (membershipFetchError) {
      console.error(
        "Membership fetch error:",
        membershipFetchError,
      );

      throw membershipFetchError;
    }

    // No membership found
    if (!membershipData) {
      return null;
    }

    // 2. Fetch the membership plan using plan_id
    let planData = null;

    if (membershipData.plan_id) {
      const {
        data,
        error: planFetchError,
      } = await db
        .from("membership_plans")
        .select("*")
        .eq("id", membershipData.plan_id)
        .maybeSingle();

      if (planFetchError) {
        console.error(
          "Membership plan fetch error:",
          planFetchError,
        );

        throw planFetchError;
      }

      planData = data;
    }

    // 3. Return membership + its plan
    return {
      ...membershipData,
      membership_plans: planData,
    } as Membership;
  },
});

  /*
   * When the user's membership is loaded,
   * make that plan appear selected.
   *
   * IMPORTANT:
   * This selects ONLY the actual membership plan.
   */
  useEffect(() => {
    if (membership?.plan_id) {
      setSelectedPlanId(membership.plan_id);
    }
  }, [membership?.plan_id]);

  /*
   * Load membership usage.
   */
  const {
    data: usage = [],
    isLoading: usageLoading,
  } = useQuery<Usage[]>({
    queryKey: ["my-membership-usage", membership?.id],

    enabled: Boolean(membership?.id),

    queryFn: async () => {
      if (!membership?.id) {
        return [];
      }

      const { data, error } = await db
        .from("membership_usage")
        .select(
          `
            *,
            courts(name)
          `,
        )
        .eq("membership_id", membership.id)
        .eq("status", "USED")
        .order("usage_date", {
          ascending: false,
        })
        .order("slot_hour", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      return (data ?? []) as Usage[];
    },
  });

  /*
   * Select membership.
   *
   * The actual membership is created by the Supabase RPC.
   */
  const requestMembership = useMutation({
    mutationFn: async (planId: string) => {
      if (!user?.id) {
        throw new Error(
          "Please login to select a membership.",
        );
      }

      /*
       * Immediately show only the clicked plan as selected.
       */
      setSelectedPlanId(planId);

      const { data, error } = await db.rpc(
        "request_membership",
        {
          _plan_id: planId,
        },
      );

      if (error) {
        /*
         * If the database request fails,
         * remove the temporary selection.
         */
        setSelectedPlanId(
          membership?.plan_id ?? null,
        );

        throw error;
      }

      return data;
    },

    onSuccess: async () => {
      toast.success(
        "Membership selected. Pickle Hub admin will activate it.",
      );

      await queryClient.invalidateQueries({
        queryKey: ["my-membership", user?.id],
      });

      await queryClient.invalidateQueries({
        queryKey: ["admin-memberships"],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  /*
   * User already has a membership request/active membership.
   */
  const hasMembership =
    membership?.status === "PENDING" ||
    membership?.status === "ACTIVE";

  const usedHours = Number(
    membership?.used_hours ?? 0,
  );

  const totalHours = Number(
    membership?.total_hours ??
      membership?.membership_plans?.total_hours ??
      0,
  );

  const remainingHours = Math.max(
    totalHours - usedHours,
    0,
  );

  const percentage =
    totalHours > 0
      ? Math.min(
          Math.round((usedHours / totalHours) * 100),
          100,
        )
      : 0;

  return (
    <SiteLayout>
      <main className="min-h-screen bg-background">

        {/* ===================================================== */}
        {/* HERO */}
        {/* ===================================================== */}

        <section className="border-b bg-gradient-to-br from-purple-950 via-purple-800 to-fuchsia-900 text-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">

            <p className="text-sm font-bold uppercase tracking-[0.25em] text-yellow-300">
              Pickle Hub
            </p>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              Membership
            </h1>

            <p className="mt-4 max-w-2xl text-white/80">
              Choose a membership that fits your playing
              schedule and keep track of every hour.
            </p>

          </div>
        </section>

        {/* ===================================================== */}
        {/* MEMBERSHIP IMAGE */}
        {/* ===================================================== */}

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border bg-white shadow-xl">
            <img
              src="/membership.jpeg"
              alt="Pickle Hub Membership Plans"
              className="h-auto w-full"
            />
          </div>
        </section>

        {/* ===================================================== */}
        {/* MEMBERSHIP PLANS */}
        {/* ===================================================== */}

        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">

          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Membership Plans
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Choose your membership
            </h2>

            <p className="mt-2 text-muted-foreground">
              Guests can view the plans. Login is required
              to select one.
            </p>
          </div>

          {plansLoading ? (
            <div className="rounded-2xl border p-8 text-center">
              Loading membership plans...
            </div>
          ) : plansError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
              Unable to load membership plans.
              Please try again.
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-2xl border p-8 text-center text-muted-foreground">
              No membership plans are currently available.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">

              {plans.map((plan) => {

                /*
                 * ONLY THIS PLAN is selected.
                 *
                 * This fixes the problem where all four
                 * buttons appeared selected.
                 */
                const selected =
                  selectedPlanId === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`rounded-3xl border p-6 shadow-sm transition-all duration-200 ${
                      selected
                        ? "border-purple-600 bg-purple-50 ring-2 ring-purple-300 shadow-md"
                        : "border-border bg-card hover:border-purple-300 hover:shadow-md"
                    }`}
                  >

                    {/* PLAN HEADER */}

                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <h3 className="text-xl font-black">
                          {plan.name}
                        </h3>

                        <p className="mt-2 text-sm text-muted-foreground">
                          {plan.description}
                        </p>
                      </div>

                      <BadgeCheck
                        className={`h-7 w-7 shrink-0 ${
                          selected
                            ? "text-purple-700"
                            : "text-purple-500"
                        }`}
                      />

                    </div>

                    {/* PLAN DETAILS */}

                    <div className="mt-6 grid grid-cols-2 gap-4">

                      <div className="rounded-2xl bg-muted p-4">
                        <p className="text-sm text-muted-foreground">
                          Total Hours
                        </p>

                        <p className="mt-1 text-2xl font-black">
                          {plan.total_hours}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-muted p-4">
                        <p className="text-sm text-muted-foreground">
                          Rate
                        </p>

                        <p className="mt-1 text-2xl font-black">
                          ₹
                          {Number(
                            plan.rate_per_hour,
                          ).toFixed(0)}

                          <span className="text-sm font-medium">
                            /hr
                          </span>
                        </p>
                      </div>

                    </div>

                    {/* RESTRICTION */}

                    <div className="mt-5 flex items-center gap-2 text-sm">

                      <Clock3 className="h-4 w-4 text-purple-700" />

                      {plan.restriction === "ANYTIME"
                        ? "Anytime – No time restriction"
                        : "Non-peak – 5 AM to 5 PM"}

                    </div>

                    {/* SELECT / MEMBERSHIP ACTION */}

                      <div className="mt-6">

                        {/* GUEST - VIEW ONLY */}

                        {!user ? (
                          <div className="rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-center">
                            <p className="text-sm font-semibold text-purple-950">
                              Login required to take this membership
                            </p>

                          </div>

                        ) : hasMembership ? (

                          /*
                          * USER ALREADY HAS A MEMBERSHIP
                          *
                          * Do not allow another membership to be selected.
                          */

                          <Button
                            disabled
                            className={`w-full ${
                              selected
                                ? "bg-purple-700 text-white"
                                : ""
                            }`}
                          >
                            {selected
                              ? "Current Membership"
                              : "Membership Already Selected"}
                          </Button>

                        ) : (

                          /*
                          * LOGGED-IN USER WITHOUT MEMBERSHIP
                          *
                          * User can select a membership.
                          */

                          <Button
                            variant="royal"
                            className={`w-full ${
                              selected
                                ? "ring-2 ring-purple-300"
                                : ""
                            }`}
                            disabled={requestMembership.isPending}
                            onClick={() => {
                              requestMembership.mutate(plan.id);
                            }}
                          >
                            {requestMembership.isPending && selected
                              ? "Selecting..."
                              : selected
                                ? "Selected"
                                : "Select This Membership"}
                          </Button>

                        )}

                      </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

        {/* ===================================================== */}
        {/* MY MEMBERSHIP */}
        {/* ===================================================== */}

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">

          <div className="mb-8">

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Member Area
            </p>

            <h2 className="mt-2 text-3xl font-black">
              My Membership
            </h2>

            <p className="mt-2 text-muted-foreground">
              {user
                ? "Your membership is view-only. Pickle Hub admin controls activation, editing and usage."
                : "Login to select a membership and view your membership here."}
            </p>

          </div>

          {/* GUEST */}

          {!user ? (

            <div className="rounded-3xl border bg-card p-10 text-center shadow-sm">

              <CreditCard className="mx-auto h-10 w-10 text-purple-700" />

              <h3 className="mt-4 text-xl font-black">
                Login required
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                You can view membership plans as a
                guest, but you must login before
                selecting a membership.
              </p>

              <Button
                asChild
                variant="royal"
                className="mt-6"
              >
                <Link to="/login">
                  Login to Continue
                </Link>
              </Button>

            </div>

          ) : membershipLoading ? (

            <div className="rounded-3xl border p-10 text-center">
              Loading your membership...
            </div>

          ) : membershipError ? (

            <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-red-700">
              Unable to load your membership.
              Please refresh the page.
            </div>

          ) : !membership ? (

            <div className="rounded-3xl border bg-card p-10 text-center shadow-sm">

              <CreditCard className="mx-auto h-10 w-10 text-purple-700" />

              <h3 className="mt-4 text-xl font-black">
                No membership selected
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Select one of the plans above.
                Your request will appear here
                immediately and the admin will
                activate it.
              </p>

            </div>

          ) : (

            <div className="space-y-6">

              {/* ================================================= */}
              {/* MEMBERSHIP CARD */}
              {/* ================================================= */}

              <div className="overflow-hidden rounded-3xl border bg-white shadow-xl">

                <div className="bg-purple-950 px-6 py-5 text-white">

                  <div className="flex flex-wrap items-center justify-between gap-4">

                    <div>

                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-300">
                        My Membership Card
                      </p>

                      <h3 className="mt-1 text-2xl font-black">
                        {membership.membership_plans?.name ??
                          "Membership"}
                      </h3>

                    </div>

                    <span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-purple-950">
                      {membership.status ?? "PENDING"}
                    </span>

                  </div>

                </div>

                <div className="relative">
  <img
    src={
      Number(membership.total_hours ?? 0) === 10
        ? "/10membershipcard.jpeg"
        : "/membershipcard.jpeg"
    }
    alt="Pickle Hub Membership Card"
    className="w-full"
  />

  {/* MEMBER NAME */}
  <div className="absolute left-[10%] top-[82%]">
    <p className="text-xs font-bold text-purple-950 sm:text-lg">
      {membership.member_name ||
        profile?.full_name ||
        "Member"}
    </p>
  </div>

  {/* VALID FROM */}
  <div className="absolute right-[8%] top-[82%]">
    <p className="text-xs font-bold text-purple-950 sm:text-lg">
      {dateText(membership.valid_from)}
    </p>
  </div>

  {/* ================================================= */}
  {/* COMPLETED BOOKING SLOT TICKS */}
  {/* ================================================= */}

  {Array.from(
    {
      length:
        Number(membership.total_hours ?? 0) === 10
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

      if (!completed) return null;

      const row = Math.floor(index / 5);
      const column = index % 5;

      return (
        <div
          key={slotNumber}
          className="absolute flex items-center justify-center"
          style={{
            /*
             * These positions are for the 5-column
             * membership-card layout.
             */
            left: `${42 + column * 10.8}%`,
            top: `${8 + row * 18}%`,
            width: "9%",
            height: "12%",
          }}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white shadow-md sm:h-9 sm:w-9">
            <CheckCircle2 className="h-5 w-5 stroke-[4] sm:h-6 sm:w-6" />
          </div>
        </div>
      );
    },
  )}
</div>

              </div>

              {/* ================================================= */}
{/* MEMBERSHIP SLOT STATUS */}
{/* ================================================= */}

<div className="rounded-3xl border bg-card p-6">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-700">
        My Booking Slots
      </p>

      <h3 className="mt-1 text-xl font-black">
        Attendance
      </h3>

      <p className="mt-1 text-sm text-muted-foreground">
        Your completed membership slots are shown with a tick.
      </p>
    </div>

    <div className="rounded-full bg-yellow-300 px-4 py-2 text-sm font-black text-purple-950">
      {usage.filter((item) => item.status === "USED").length} /{" "}
      {totalHours} completed
    </div>
  </div>

  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
    {Array.from(
      {
        length: totalHours === 10 ? 10 : 20,
      },
      (_, index) => {
        const slotNumber = index + 1;

        const completed = usage.some(
          (item) =>
            Number(item.slot_number) === slotNumber &&
            item.status === "USED",
        );

        return (
          <div
            key={slotNumber}
            className={`flex aspect-[1.5] items-center justify-center rounded-xl border-2 ${
              completed
                ? "border-green-600 bg-green-500 text-white"
                : "border-purple-200 bg-white text-purple-900"
            }`}
          >
            {completed ? (
              <div className="flex flex-col items-center">
                <CheckCircle2 className="h-7 w-7 stroke-[4]" />
                <span className="text-xs font-black">
                  {slotNumber}
                </span>
              </div>
            ) : (
              <span className="text-lg font-black">
                {slotNumber}
              </span>
            )}
          </div>
        );
      },
    )}
  </div>
</div>

              {/* PENDING MESSAGE */}

              {membership.status === "PENDING" && (
                <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
                  Your membership has been selected
                  and is waiting for Pickle Hub admin
                  activation. You cannot edit membership
                  details or usage.
                </div>
              )}

              {/* ================================================= */}
              {/* HOURS */}
              {/* ================================================= */}

              <div className="grid gap-4 sm:grid-cols-3">

                <div className="rounded-2xl border bg-card p-5">
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Total Hours
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {totalHours}
                  </p>
                </div>

                <div className="rounded-2xl border bg-card p-5">
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Used Hours
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {usedHours}
                  </p>
                </div>

                <div className="rounded-2xl border bg-purple-50 p-5">
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Remaining
                  </p>

                  <p className="mt-2 text-3xl font-black text-purple-800">
                    {remainingHours}
                  </p>
                </div>

              </div>

              {/* ================================================= */}
              {/* PROGRESS */}
              {/* ================================================= */}

              <div className="rounded-3xl border bg-card p-6">

                <div className="flex items-center justify-between gap-4">

                  <div>

                    <p className="text-sm font-bold">
                      Membership Usage
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {percentage}% of your membership
                      hours have been used.
                    </p>

                  </div>

                  <ShieldCheck className="h-6 w-6 text-purple-700" />

                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">

                  <div
                    className="h-full rounded-full bg-purple-700 transition-all"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />

                </div>

              </div>

              {/* ================================================= */}
              {/* MEMBER DETAILS */}
              {/* ================================================= */}

              <div className="rounded-3xl border bg-card p-6">

                <div className="grid gap-5 sm:grid-cols-4">

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Member
                    </p>

                    <p className="mt-1 font-bold">
                      {membership.member_name ||
                        profile?.full_name ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Card Number
                    </p>

                    <p className="mt-1 font-bold">
                      {membership.card_number ||
                        "Assigned by admin"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Valid From
                    </p>

                    <p className="mt-1 font-bold">
                      {dateText(
                        membership.valid_from,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Valid Until
                    </p>

                    <p className="mt-1 font-bold">
                      {dateText(
                        membership.valid_until,
                      )}
                    </p>
                  </div>

                </div>

              </div>

              {/* ================================================= */}
              {/* USAGE HISTORY */}
              {/* ================================================= */}

              <div className="rounded-3xl border bg-card p-6">

                <div className="flex items-center gap-2">

                  <CheckCircle2 className="h-5 w-5 text-purple-700" />

                  <h3 className="text-xl font-black">
                    My Booking Usage
                  </h3>

                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Only Pickle Hub admin can mark a
                  booking as membership usage.
                </p>

                <div className="mt-5 overflow-x-auto rounded-2xl border">

                  <table className="w-full min-w-[700px] text-sm">

                    <thead className="bg-purple-50 text-purple-950">

                      <tr>

                        <th className="px-4 py-3 text-left">
                          Date
                        </th>

                        <th className="px-4 py-3 text-left">
                          Court
                        </th>

                        <th className="px-4 py-3 text-left">
                          Time
                        </th>

                        <th className="px-4 py-3 text-left">
                          Hours
                        </th>

                        <th className="px-4 py-3 text-left">
                          Status
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {usageLoading ? (

                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center"
                          >
                            Loading usage...
                          </td>
                        </tr>

                      ) : usage.length === 0 ? (

                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-muted-foreground"
                          >
                            No membership bookings
                            marked yet.
                          </td>
                        </tr>

                      ) : (

                        usage.map((item) => (

                          <tr
                            key={item.id}
                            className="border-t"
                          >

                            <td className="px-4 py-3">
                              {dateText(
                                item.usage_date,
                              )}
                            </td>

                            <td className="px-4 py-3">
                              {item.courts?.name ??
                                `Court ${item.court_id}`}
                            </td>

                            <td className="px-4 py-3">
                              {slotText(
                                item.slot_hour,
                              )}
                            </td>

                            <td className="px-4 py-3">
                              {item.hours}
                            </td>

                            <td className="px-4 py-3 font-bold">
                              {item.status}
                            </td>

                          </tr>

                        ))

                      )}

                    </tbody>

                  </table>

                </div>

              </div>

              {/* ================================================= */}
              {/* VIEW ONLY NOTICE */}
              {/* ================================================= */}

              <div className="flex items-center gap-2 rounded-2xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-950">

                <CalendarDays className="h-5 w-5 shrink-0" />

                <span>
                  <strong>View only:</strong>{" "}
                  membership details, card number,
                  validity and used hours can only
                  be changed by Pickle Hub admin.
                </span>

              </div>

            </div>
          )}

        </section>
      </main>
    </SiteLayout>
  );
}
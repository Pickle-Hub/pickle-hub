import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BlockedSlot, Booking, CafeItem, CafeOrder, Court, PaymentSettings } from "@/lib/pickle";

export const useCourts = () =>
  useQuery({
    queryKey: ["courts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courts").select("*").order("id");
      if (error) throw error;
      return (data ?? []) as unknown as Court[];
    },
    staleTime: 60_000,
  });

export const usePaymentSettings = () =>
  useQuery({
    queryKey: ["payment_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_settings").select("*").maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as PaymentSettings | null;
    },
    staleTime: 30_000,
  });

/** Public availability for a single date (no customer PII). */
export const useAvailability = (dateKey: string) => {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`availability-${dateKey}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        void qc.invalidateQueries({ queryKey: ["availability"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "blocked_slots" }, () => {
        void qc.invalidateQueries({ queryKey: ["availability"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [dateKey, qc]);

  return useQuery({
    queryKey: ["availability", dateKey],
    queryFn: async () => {
      const [taken, blocked] = await Promise.all([
        supabase.rpc("slot_availability", { _date: dateKey }),
        supabase.from("blocked_slots").select("*").eq("blocked_date", dateKey),
      ]);
      if (taken.error) throw taken.error;
      if (blocked.error) throw blocked.error;
      return {
        taken: (taken.data ?? []) as { court_id: number; slot_hour: number; state: string }[],
        blocked: (blocked.data ?? []) as unknown as BlockedSlot[],
      };
    },
    staleTime: 5_000,
  });
};

export const useMyBookings = (userId: string | undefined) =>
  useQuery({
    enabled: Boolean(userId),
    queryKey: ["my-bookings", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", userId!)
        .order("booking_date", { ascending: false })
        .order("slot_hour", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Booking[];
    },
  });

export const useBooking = (id: string | undefined) =>
  useQuery({
    enabled: Boolean(id),
    queryKey: ["booking", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_booking_by_id", { _id: id! });
      if (error) throw error;
      return ((data as unknown as Booking | null) ?? null) as Booking | null;
    },
  });

/** Admin: every booking in a date range. */
export const useBookingsRange = (from: string, to: string, enabled = true) => {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel(`admin-bookings-${from}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        void qc.invalidateQueries({ queryKey: ["bookings-range"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [from, enabled, qc]);

  return useQuery({
    enabled,
    queryKey: ["bookings-range", from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .gte("booking_date", from)
        .lte("booking_date", to)
        .order("slot_hour");
      if (error) throw error;
      return (data ?? []) as unknown as Booking[];
    },
  });
};

export const useBlockedRange = (from: string, to: string, enabled = true) =>
  useQuery({
    enabled,
    queryKey: ["blocked-range", from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_slots")
        .select("*")
        .gte("blocked_date", from)
        .lte("blocked_date", to);
      if (error) throw error;
      return (data ?? []) as unknown as BlockedSlot[];
    },
  });

export const useCustomerCount = (enabled = true) =>
  useQuery({
    enabled,
    queryKey: ["customer-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

/** Café menu (public read). */
export const useCafeItems = () =>
  useQuery({
    queryKey: ["cafe-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cafe_items").select("*").order("category").order("name");
      if (error) throw error;
      return (data ?? []) as unknown as CafeItem[];
    },
    staleTime: 30_000,
  });

/** Café orders — own orders for customers, all orders for admins (RLS decides). */
export const useCafeOrders = (enabled = true) => {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel("cafe-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "cafe_orders" }, () => {
        void qc.invalidateQueries({ queryKey: ["cafe-orders"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, qc]);

  return useQuery({
    enabled,
    queryKey: ["cafe-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cafe_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CafeOrder[];
    },
  });
};

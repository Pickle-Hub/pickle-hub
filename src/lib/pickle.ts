export const OPEN_HOUR = 5;
export const CLOSE_HOUR = 24;

export type Court = {
  id: number;
  name: string;
  surface: string;
  opening_hour: number;
  closing_hour: number;
  day_rate: number;
  evening_rate: number;
  evening_start_hour: number;
  max_players: number;
  active: boolean;
};

export type Booking = {
  id: string;
  booking_code: string;
  user_id: string | null;
  court_id: number;
  booking_date: string;
  slot_hour: number;
  players: number;
  amount: number;
  customer_name: string;
  customer_phone: string;
  status: "BOOKED" | "PENDING_PAYMENT" | "CANCELLED";
  payment_status:
    | "PENDING"
    | "PENDING_VERIFICATION"
    | "PAID"
    | "REJECTED"
    | "REFUNDED";
  payment_method: string;
  payment_reference: string | null;
  payment_screenshot: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BlockedSlot = {
  id: string;
  court_id: number | null;
  blocked_date: string;
  slot_hour: number | null;
  reason: string;
};

export type PaymentSettings = {
  id: boolean;
  upi_id: string;
  upi_name: string;
  qr_image_path: string | null;
  upi_deep_link: string | null;
  instructions: string;
};

export const hourList = (open = OPEN_HOUR, close = CLOSE_HOUR) =>
  Array.from({ length: close - open }, (_, i) => open + i);

export const hourLabel = (h: number) => {
  const norm = ((h % 24) + 24) % 24;
  const suffix = norm >= 12 ? "PM" : "AM";
  const display = norm % 12 === 0 ? 12 : norm % 12;

  return `${String(display).padStart(2, "0")}:00 ${suffix}`;
};

export const slotLabel = (h: number) =>
  `${hourLabel(h)} – ${hourLabel(h + 1)}`;

/**
 * Pickle Hub pricing
 *
 * Monday – Friday
 *   5 AM – 5 PM  → ₹500/hour
 *   5 PM – 12 AM → ₹700/hour
 *
 * Saturday – Sunday
 *   5 AM – 5 PM  → ₹600/hour
 *   5 PM – 12 AM → ₹800/hour
 *
 * `dateKey` must be yyyy-mm-dd.
 */
export const rateFor = (
  court: Pick<Court, "day_rate" | "evening_rate" | "evening_start_hour">,
  hour: number,
  dateKey?: string,
) => {
  const date = dateKey ? fromDateKey(dateKey) : new Date();
  const day = date.getDay();

  const isWeekend = day === 0 || day === 6;
  const isEvening = hour >= 17;

  if (isWeekend) {
    return isEvening ? 800 : 600;
  }

  return isEvening ? 700 : 500;
};

export const inr = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

/** local (not UTC) yyyy-mm-dd */
export const toDateKey = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const fromDateKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);

  return new Date(
    y!,
    (m ?? 1) - 1,
    d ?? 1,
  );
};

export const prettyDate = (key: string) => {
  const d = fromDateKey(key);

  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const ddmmyyyy = (key: string) => {
  const [y, m, d] = key.split("-");

  return `${d}/${m}/${y}`;
};

export const addDays = (key: string, days: number) => {
  const d = fromDateKey(key);

  d.setDate(d.getDate() + days);

  return toDateKey(d);
};

/** Monday-start week for a given date key */
export const weekStart = (key: string) => {
  const d = fromDateKey(key);

  const dow = (d.getDay() + 6) % 7;

  d.setDate(d.getDate() - dow);

  return toDateKey(d);
};

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export type SlotState =
  | "AVAILABLE"
  | "BOOKED"
  | "BLOCKED"
  | "PENDING_PAYMENT"
  | "CANCELLED";

export const statusMeta: Record<
  string,
  { label: string; className: string }
> = {
  AVAILABLE: {
    label: "Available",
    className:
      "bg-success/12 text-success border-success/30",
  },

  BOOKED: {
    label: "Booked",
    className:
      "bg-destructive/12 text-destructive border-destructive/30",
  },

  PENDING_PAYMENT: {
    label: "Payment pending",
    className:
      "bg-warning/20 text-warning-foreground border-warning/40",
  },

  BLOCKED: {
    label: "Blocked",
    className:
      "bg-muted text-muted-foreground border-border",
  },

  CANCELLED: {
    label: "Cancelled",
    className:
      "bg-muted text-muted-foreground border-border",
  },
};

export const paymentMeta: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Payment pending",
    className:
      "bg-warning/20 text-warning-foreground border-warning/40",
  },

  PENDING_VERIFICATION: {
    label: "Awaiting verification",
    className:
      "bg-primary/10 text-primary border-primary/30",
  },

  PAID: {
    label: "Paid",
    className:
      "bg-success/12 text-success border-success/30",
  },

  REJECTED: {
    label: "Rejected",
    className:
      "bg-destructive/12 text-destructive border-destructive/30",
  },

  REFUNDED: {
    label: "Refunded",
    className:
      "bg-muted text-muted-foreground border-border",
  },
};

const digits = (phone: string) => {
  const d = phone.replace(/\D/g, "");

  if (!d) return "";

  return d.length === 10 ? `91${d}` : d;
};

export const waLink = (
  phone: string,
  message: string,
) =>
  `https://wa.me/${digits(
    phone,
  )}?text=${encodeURIComponent(message)}`;

export const confirmMessage = (
  b: Booking,
  courtName: string,
) =>
  `Hi ${b.customer_name || "there"},\nYour Pickle Hub booking is confirmed.\n\nCourt: ${courtName}\nDate: ${ddmmyyyy(
    b.booking_date,
  )}\nTime: ${slotLabel(
    b.slot_hour,
  )}\nAmount: ${inr(
    b.amount,
  )}\n\nThank you for choosing Pickle Hub!`;

export const reminderMessage = (
  b: Booking,
  courtName: string,
) =>
  `Hi ${b.customer_name || "there"},\nThis is a reminder regarding your Pickle Hub booking.\n\nCourt: ${courtName}\nDate: ${ddmmyyyy(
    b.booking_date,
  )}\nTime: ${slotLabel(
    b.slot_hour,
  )}\nAmount Pending: ${inr(
    b.amount,
  )}\n\nPlease complete the payment.`;

export const reviewMessage = (
  b: Booking,
  courtName: string,
) =>
  `Hi ${b.customer_name || "there"},\nThanks for playing at Pickle Hub on ${ddmmyyyy(
    b.booking_date,
  )} (${courtName}, ${slotLabel(
    b.slot_hour,
  )}).\n\nWe'd love a quick review of your experience — it really helps us improve.\n\nSee you on court again soon!`;

export const isPast = (
  dateKey: string,
  hour: number,
) => {
  const d = fromDateKey(dateKey);

  d.setHours(hour + 1, 0, 0, 0);

  return d.getTime() < Date.now();
};

export const CLUB = {
  name: "Pickle Hub",

  phone: "9159050599",

  phoneAlt: "9345311171",

  phoneDisplay: "9159050599 / 9345311171",

  email: "picklehubsvks2026@gmail.com",

  instagram: "picklehub.svks",

  address:
    "Pickle Hub, Saratha Nagar, Near Bell Printers, Sivakasi",

  mapsQuery:
    "Pickle+Hub,Saratha+Nagar,Near+Bell+Printers,Sivakasi",

  hours: "5:00 AM – 12:00 AM, all week",

  courts: 2,

  maxPlayers: 4,
};

export type CafeItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  available: boolean;
  image_url: string | null;
};

export type CafeOrder = {
  id: string;
  order_code: string;
  user_id: string;
  booking_id: string | null;
  item_id: string | null;
  item_name: string;
  unit_price: number;
  quantity: number;
  amount: number;
  customer_name: string;
  customer_phone: string;
  notes: string | null;
  status:
    | "PLACED"
    | "PREPARING"
    | "SERVED"
    | "CANCELLED";
  created_at: string;
};

export const cafeStatusMeta: Record<
  string,
  { label: string; className: string }
> = {
  PLACED: {
    label: "Placed",
    className:
      "bg-warning/20 text-warning-foreground border-warning/40",
  },

  PREPARING: {
    label: "Preparing",
    className:
      "bg-primary/10 text-primary border-primary/30",
  },

  SERVED: {
    label: "Served",
    className:
      "bg-success/12 text-success border-success/30",
  },

  CANCELLED: {
    label: "Cancelled",
    className:
      "bg-muted text-muted-foreground border-border",
  },
};
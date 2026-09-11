
CREATE TYPE public.app_role AS ENUM ('admin','customer');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone_number text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "roles read own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE TABLE public.courts (
  id int PRIMARY KEY,
  name text NOT NULL,
  surface text NOT NULL DEFAULT 'Acrylic Cushioned',
  opening_hour int NOT NULL DEFAULT 5,
  closing_hour int NOT NULL DEFAULT 24,
  day_rate numeric NOT NULL DEFAULT 600,
  evening_rate numeric NOT NULL DEFAULT 800,
  evening_start_hour int NOT NULL DEFAULT 17,
  max_players int NOT NULL DEFAULT 4,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.courts TO authenticated;
GRANT ALL ON public.courts TO service_role;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courts public read" ON public.courts FOR SELECT USING (true);
CREATE POLICY "courts admin write" ON public.courts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.courts (id, name) VALUES (1,'Court 1'), (2,'Court 2');

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code text NOT NULL UNIQUE DEFAULT 'PH-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  court_id int NOT NULL REFERENCES public.courts(id),
  booking_date date NOT NULL,
  slot_hour int NOT NULL CHECK (slot_hour BETWEEN 0 AND 23),
  players int NOT NULL DEFAULT 4,
  amount numeric NOT NULL DEFAULT 0,
  customer_name text NOT NULL DEFAULT '',
  customer_phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (status IN ('BOOKED','PENDING_PAYMENT','CANCELLED')),
  payment_status text NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING','PENDING_VERIFICATION','PAID','REJECTED','REFUNDED')),
  payment_method text NOT NULL DEFAULT 'UPI_QR' CHECK (payment_method IN ('UPI_QR','VENUE','CASH')),
  payment_reference text,
  payment_screenshot text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX bookings_no_double_booking
  ON public.bookings (court_id, booking_date, slot_hour)
  WHERE status <> 'CANCELLED';
CREATE INDEX bookings_date_idx ON public.bookings (booking_date);
CREATE INDEX bookings_user_idx ON public.bookings (user_id);
CREATE INDEX bookings_status_idx ON public.bookings (status);
CREATE INDEX bookings_pay_idx ON public.bookings (payment_status);
CREATE INDEX bookings_court_idx ON public.bookings (court_id);

GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings own read" ON public.bookings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "bookings insert own" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK ((user_id = auth.uid() AND payment_status IN ('PENDING','PENDING_VERIFICATION')) OR public.is_admin());
CREATE POLICY "bookings admin update" ON public.bookings FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "bookings owner update" ON public.bookings FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.guard_booking_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF public.is_admin() THEN RETURN NEW; END IF;
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     AND NEW.payment_status NOT IN ('PENDING','PENDING_VERIFICATION') THEN
    RAISE EXCEPTION 'Only admins can change payment status';
  END IF;
  IF NEW.amount IS DISTINCT FROM OLD.amount
     OR NEW.court_id IS DISTINCT FROM OLD.court_id
     OR NEW.booking_date IS DISTINCT FROM OLD.booking_date
     OR NEW.slot_hour IS DISTINCT FROM OLD.slot_hour
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'CANCELLED' THEN
    RAISE EXCEPTION 'Customers may only cancel';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER bookings_guard BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.guard_booking_update();

CREATE TABLE public.blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id int REFERENCES public.courts(id),
  blocked_date date NOT NULL,
  slot_hour int,
  reason text NOT NULL DEFAULT 'Blocked by admin',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blocked_date_idx ON public.blocked_slots (blocked_date);
GRANT SELECT ON public.blocked_slots TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blocked_slots TO authenticated;
GRANT ALL ON public.blocked_slots TO service_role;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocked public read" ON public.blocked_slots FOR SELECT USING (true);
CREATE POLICY "blocked admin write" ON public.blocked_slots FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.payment_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  upi_id text NOT NULL DEFAULT 'picklehub@upi',
  upi_name text NOT NULL DEFAULT 'Pickle Hub',
  qr_image_path text,
  upi_deep_link text,
  instructions text NOT NULL DEFAULT 'Scan the QR code and pay the exact booking amount, then enter your UPI reference number below.',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pay settings public read" ON public.payment_settings FOR SELECT USING (true);
CREATE POLICY "pay settings admin write" ON public.payment_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO public.payment_settings (id) VALUES (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone_number)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name',''),
          COALESCE(NEW.email,''),
          COALESCE(NEW.raw_user_meta_data->>'phone_number',''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.create_booking(
  _court_id int, _booking_date date, _slot_hour int, _players int, _payment_method text
) RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_court public.courts%ROWTYPE;
  v_amount numeric;
  v_profile public.profiles%ROWTYPE;
  v_row public.bookings%ROWTYPE;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'You must be signed in to book'; END IF;
  SELECT * INTO v_court FROM public.courts WHERE id = _court_id AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Court not available'; END IF;
  IF _slot_hour < v_court.opening_hour OR _slot_hour >= v_court.closing_hour THEN
    RAISE EXCEPTION 'Slot outside opening hours';
  END IF;
  IF _booking_date < (now() AT TIME ZONE 'Asia/Kolkata')::date THEN
    RAISE EXCEPTION 'Cannot book a past date';
  END IF;
  IF EXISTS (SELECT 1 FROM public.blocked_slots b
             WHERE b.blocked_date = _booking_date
               AND (b.court_id IS NULL OR b.court_id = _court_id)
               AND (b.slot_hour IS NULL OR b.slot_hour = _slot_hour)) THEN
    RAISE EXCEPTION 'This slot is blocked';
  END IF;
  v_amount := CASE WHEN _slot_hour >= v_court.evening_start_hour
                   THEN v_court.evening_rate ELSE v_court.day_rate END;
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;

  INSERT INTO public.bookings
    (user_id, court_id, booking_date, slot_hour, players, amount,
     customer_name, customer_phone, status, payment_status, payment_method)
  VALUES
    (v_uid, _court_id, _booking_date, _slot_hour,
     GREATEST(1, LEAST(COALESCE(_players,4), v_court.max_players)), v_amount,
     COALESCE(v_profile.full_name,''), COALESCE(v_profile.phone_number,''),
     'BOOKED', 'PENDING',
     CASE WHEN _payment_method = 'VENUE' THEN 'VENUE' ELSE 'UPI_QR' END)
  RETURNING * INTO v_row;
  RETURN v_row;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'That slot has just been booked by someone else';
END; $$;
GRANT EXECUTE ON FUNCTION public.create_booking(int,date,int,int,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.slot_availability(_date date)
RETURNS TABLE (court_id int, slot_hour int, state text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.court_id, b.slot_hour,
         CASE WHEN b.payment_status = 'PAID' THEN 'BOOKED' ELSE b.status END
  FROM public.bookings b
  WHERE b.booking_date = _date AND b.status <> 'CANCELLED'
$$;
GRANT EXECUTE ON FUNCTION public.slot_availability(date) TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_slots;

CREATE POLICY "qr read" ON storage.objects FOR SELECT USING (bucket_id = 'payment-qr');
CREATE POLICY "qr admin write" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'payment-qr' AND public.is_admin())
  WITH CHECK (bucket_id = 'payment-qr' AND public.is_admin());
CREATE POLICY "proof read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'payment-proofs');
CREATE POLICY "proof upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs');

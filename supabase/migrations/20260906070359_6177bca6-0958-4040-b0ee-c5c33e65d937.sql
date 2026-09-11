
-- Guest booking creation
CREATE OR REPLACE FUNCTION public.create_guest_booking(
  _court_id integer,
  _booking_date date,
  _slot_hour integer,
  _payment_method text,
  _customer_name text,
  _customer_phone text
) RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_court public.courts%ROWTYPE;
  v_amount numeric;
  v_row public.bookings%ROWTYPE;
  v_uid uuid := auth.uid();
  v_name text := btrim(coalesce(_customer_name,''));
  v_phone text := btrim(coalesce(_customer_phone,''));
BEGIN
  IF length(v_name) < 2 OR length(v_name) > 80 THEN RAISE EXCEPTION 'Please enter your full name'; END IF;
  IF regexp_replace(v_phone,'\D','','g') !~ '^[0-9]{10,15}$' THEN RAISE EXCEPTION 'Please enter a valid phone number'; END IF;

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

  INSERT INTO public.bookings
    (user_id, court_id, booking_date, slot_hour, players, amount,
     customer_name, customer_phone, status, payment_status, payment_method)
  VALUES
    (v_uid, _court_id, _booking_date, _slot_hour, 4, v_amount,
     v_name, v_phone, 'BOOKED', 'PENDING',
     CASE WHEN _payment_method = 'VENUE' THEN 'VENUE' ELSE 'UPI_QR' END)
  RETURNING * INTO v_row;
  RETURN v_row;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'That slot has just been booked by someone else';
END; $$;

REVOKE ALL ON FUNCTION public.create_guest_booking(integer,date,integer,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_guest_booking(integer,date,integer,text,text,text) TO anon, authenticated;

-- Fetch a booking by its private id (link acts as the access token)
CREATE OR REPLACE FUNCTION public.get_booking_by_id(_id uuid)
RETURNS public.bookings
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT * FROM public.bookings WHERE id = _id $$;

REVOKE ALL ON FUNCTION public.get_booking_by_id(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_booking_by_id(uuid) TO anon, authenticated;

-- Guest payment reference submission
CREATE OR REPLACE FUNCTION public.submit_booking_payment(_id uuid, _reference text)
RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_row public.bookings%ROWTYPE; v_ref text := btrim(coalesce(_reference,''));
BEGIN
  IF length(v_ref) < 4 OR length(v_ref) > 40 THEN RAISE EXCEPTION 'Enter a valid UPI reference number'; END IF;
  UPDATE public.bookings
     SET payment_reference = v_ref, payment_status = 'PENDING_VERIFICATION'
   WHERE id = _id AND status <> 'CANCELLED' AND payment_status IN ('PENDING','PENDING_VERIFICATION')
  RETURNING * INTO v_row;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found or already processed'; END IF;
  RETURN v_row;
END; $$;

REVOKE ALL ON FUNCTION public.submit_booking_payment(uuid,text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_booking_payment(uuid,text) TO anon, authenticated;

-- Guest cancellation
CREATE OR REPLACE FUNCTION public.cancel_booking_by_id(_id uuid)
RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_row public.bookings%ROWTYPE;
BEGIN
  UPDATE public.bookings SET status = 'CANCELLED'
   WHERE id = _id AND status <> 'CANCELLED'
  RETURNING * INTO v_row;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found or already cancelled'; END IF;
  RETURN v_row;
END; $$;

REVOKE ALL ON FUNCTION public.cancel_booking_by_id(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.cancel_booking_by_id(uuid) TO anon, authenticated;

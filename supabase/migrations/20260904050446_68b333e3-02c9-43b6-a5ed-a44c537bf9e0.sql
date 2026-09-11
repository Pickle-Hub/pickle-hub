CREATE TABLE public.cafe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Snacks',
  price numeric NOT NULL DEFAULT 0,
  available boolean NOT NULL DEFAULT true,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cafe_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cafe_items TO authenticated;
GRANT ALL ON public.cafe_items TO service_role;

ALTER TABLE public.cafe_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cafe items public read" ON public.cafe_items FOR SELECT USING (true);
CREATE POLICY "cafe items admin write" ON public.cafe_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.cafe_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text NOT NULL DEFAULT ('CF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  item_id uuid REFERENCES public.cafe_items(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  unit_price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  amount numeric NOT NULL DEFAULT 0,
  customer_name text NOT NULL DEFAULT '',
  customer_phone text NOT NULL DEFAULT '',
  notes text,
  status text NOT NULL DEFAULT 'PLACED',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cafe_orders TO authenticated;
GRANT ALL ON public.cafe_orders TO service_role;

ALTER TABLE public.cafe_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cafe orders own read" ON public.cafe_orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "cafe orders own insert" ON public.cafe_orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "cafe orders admin update" ON public.cafe_orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "cafe orders admin delete" ON public.cafe_orders FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER cafe_items_touch BEFORE UPDATE ON public.cafe_items
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER cafe_orders_touch BEFORE UPDATE ON public.cafe_orders
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.cafe_items (name, description, category, price) VALUES
  ('Cold Coffee', 'Chilled filter coffee with milk', 'Beverages', 120),
  ('Fresh Lime Soda', 'Sweet or salted, served chilled', 'Beverages', 80),
  ('Electrolyte Drink', 'Rehydration mix, orange', 'Beverages', 90),
  ('Protein Bar', 'Peanut butter and oats', 'Snacks', 150),
  ('Grilled Veg Sandwich', 'Toasted, with mint chutney', 'Snacks', 180),
  ('Paneer Wrap', 'Tandoori paneer in a whole wheat wrap', 'Meals', 220);
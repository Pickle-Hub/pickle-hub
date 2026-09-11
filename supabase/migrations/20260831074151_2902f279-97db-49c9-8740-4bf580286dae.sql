
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_booking_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.create_booking(int,date,int,int,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_booking(int,date,int,int,text) TO authenticated;
REVOKE ALL ON FUNCTION public.slot_availability(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.slot_availability(date) TO anon, authenticated;

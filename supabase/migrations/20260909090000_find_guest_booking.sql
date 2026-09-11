create or replace function public.find_guest_booking(
  _booking_code text,
  _phone text
)
returns table (
  id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text;
  normalized_phone text;
begin
  normalized_code := upper(trim(_booking_code));
  normalized_phone := regexp_replace(_phone, '\D', '', 'g');

  return query
  select b.id
  from public.bookings b
  where upper(trim(b.booking_code)) = normalized_code
    and regexp_replace(
      coalesce(b.customer_phone, ''),
      '\D',
      '',
      'g'
    ) = normalized_phone
  limit 1;
end;
$$;

revoke all on function public.find_guest_booking(text, text)
from public;

grant execute on function public.find_guest_booking(text, text)
to anon, authenticated;
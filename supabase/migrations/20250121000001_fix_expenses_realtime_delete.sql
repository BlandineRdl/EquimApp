-- Migration to fix realtime DELETE events for expenses table
--
-- Problem: When an expense is deleted, other users don't receive the realtime
-- DELETE event because RLS policies prevent them from seeing the deleted row.
--
-- Solution: Enable REPLICA IDENTITY FULL to include all row data in DELETE events,
-- allowing Supabase to send the event even if the user can't query the deleted row.

-- Enable full replica identity for expenses table
-- This ensures DELETE events include all column values, not just the primary key
ALTER TABLE public.expenses REPLICA IDENTITY FULL;

-- Note: REPLICA IDENTITY FULL means:
-- - INSERT events: Include all new row data (default behavior)
-- - UPDATE events: Include all old and new row data (default behavior)
-- - DELETE events: Include all deleted row data (NEW: previously only sent primary key)
--
-- This allows realtime listeners to receive complete DELETE events even when
-- RLS policies would normally prevent access to the deleted row.


-- Additional configuration for Realtime
-- Run this after the initial schema is created

-- Ensure Realtime is enabled for the messages table
BEGIN;
  -- Drop the existing publication if it exists
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create publication with messages table
  CREATE PUBLICATION supabase_realtime FOR TABLE messages;
COMMIT;

-- Optional: Enable Realtime for other tables if needed in future
-- ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
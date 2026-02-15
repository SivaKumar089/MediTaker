-- Add Sugar and Temperature to health_records
ALTER TABLE public.health_records ADD COLUMN IF NOT EXISTS sugar_level INTEGER;
ALTER TABLE public.health_records ADD COLUMN IF NOT EXISTS temperature DECIMAL(4,1);

-- Ensure Realtime is enabled for health_records (it was in combined_updates.sql but repeating for safety)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'health_records'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.health_records;
    END IF;
END $$;

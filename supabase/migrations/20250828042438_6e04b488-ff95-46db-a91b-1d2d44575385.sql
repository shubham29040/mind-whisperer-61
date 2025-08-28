-- Enable real-time for mood_entries table
ALTER TABLE public.mood_entries REPLICA IDENTITY FULL;

-- Add mood_entries to the realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE public.mood_entries;
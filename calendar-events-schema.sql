-- Create calendar_events table for the application
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME,
  end_time TIME,
  location TEXT,
  event_type TEXT,
  is_all_day BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies
-- 1. Allow users to view events
DROP POLICY IF EXISTS "Users can view their own events" ON public.calendar_events;
CREATE POLICY "Users can view their own events" 
  ON public.calendar_events FOR SELECT 
  USING (auth.uid() = user_id);

-- 2. Allow users to create their own events
DROP POLICY IF EXISTS "Users can create their own events" ON public.calendar_events;
CREATE POLICY "Users can create their own events" 
  ON public.calendar_events FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 3. Allow users to update their own events
DROP POLICY IF EXISTS "Users can update their own events" ON public.calendar_events;
CREATE POLICY "Users can update their own events" 
  ON public.calendar_events FOR UPDATE 
  USING (auth.uid() = user_id);

-- 4. Allow users to delete their own events
DROP POLICY IF EXISTS "Users can delete their own events" ON public.calendar_events;
CREATE POLICY "Users can delete their own events" 
  ON public.calendar_events FOR DELETE 
  USING (auth.uid() = user_id);

-- 5. Allow teachers to view all events
DROP POLICY IF EXISTS "Teachers can view all events" ON public.calendar_events;
CREATE POLICY "Teachers can view all events" 
  ON public.calendar_events FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'teacher'
    )
  );

-- Create index for faster date range queries
CREATE INDEX IF NOT EXISTS calendar_events_date_idx ON public.calendar_events(date);
CREATE INDEX IF NOT EXISTS calendar_events_user_id_idx ON public.calendar_events(user_id);

-- Insert some sample events
INSERT INTO public.calendar_events 
  (title, description, date, time, location, event_type, user_id)
VALUES
  ('School Assembly', 'Monthly school assembly', '2025-05-15', '09:00:00', 'Main Hall', 'school', 
   (SELECT id FROM public.profiles WHERE role = 'teacher' LIMIT 1)),
  ('Final Exams', 'End of year examinations', '2025-05-20', '10:00:00', 'Examination Hall', 'academic', 
   (SELECT id FROM public.profiles WHERE role = 'teacher' LIMIT 1)),
  ('Summer Break Begins', 'Last day of classes before summer', '2025-05-30', NULL, NULL, 'holiday', 
   (SELECT id FROM public.profiles WHERE role = 'teacher' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- Force schema reload
NOTIFY pgrst, 'reload schema'; 
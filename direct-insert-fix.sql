-- Enable direct insertion into post_reports table for authenticated users

-- Make sure RLS is enabled
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can create reports" ON public.post_reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.post_reports;
DROP POLICY IF EXISTS "Admins can manage all reports" ON public.post_reports;

-- Create a policy allowing users to insert their own reports
CREATE POLICY "Users can create reports" ON public.post_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (reported_by = auth.uid());

-- Create a policy allowing users to view their own reports
CREATE POLICY "Users can view their own reports" ON public.post_reports
    FOR SELECT
    TO authenticated
    USING (reported_by = auth.uid());

-- Create a policy allowing admins to manage all reports
CREATE POLICY "Admins can manage all reports" ON public.post_reports
    FOR ALL
    TO service_role
    USING (true);

-- Add a trigger to validate reports before insertion
CREATE OR REPLACE FUNCTION validate_post_report()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if post exists
  IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = NEW.post_id) THEN
    RAISE EXCEPTION 'Post with ID % does not exist', NEW.post_id;
  END IF;
  
  -- Check if user has already reported this post
  IF EXISTS (
    SELECT 1 FROM public.post_reports 
    WHERE post_id = NEW.post_id 
    AND reported_by = NEW.reported_by
    AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You have already reported this post';
  END IF;
  
  -- Set default values if not provided
  IF NEW.status IS NULL THEN
    NEW.status := 'pending';
  END IF;
  
  IF NEW.created_at IS NULL THEN
    NEW.created_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger
DROP TRIGGER IF EXISTS validate_post_report_trigger ON public.post_reports;
CREATE TRIGGER validate_post_report_trigger
BEFORE INSERT ON public.post_reports
FOR EACH ROW
EXECUTE FUNCTION validate_post_report();

-- Enable direct access to the post_reports table via API
COMMENT ON TABLE public.post_reports IS 'Table for storing user reports of posts';
COMMENT ON COLUMN public.post_reports.post_id IS 'The ID of the post being reported';
COMMENT ON COLUMN public.post_reports.reported_by IS 'The ID of the user making the report';
COMMENT ON COLUMN public.post_reports.reason IS 'The reason for the report';
COMMENT ON COLUMN public.post_reports.details IS 'Additional details about the report';
COMMENT ON COLUMN public.post_reports.status IS 'Status of the report (pending, reviewed, rejected, action_taken)';

-- Force reload of the schema
SELECT pg_notify('pgrst', 'reload schema'); 
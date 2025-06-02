-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS public.report_post(uuid, text, text);
DROP FUNCTION IF EXISTS public.report_post(text, uuid, text);
DROP FUNCTION IF EXISTS public.submit_post_report(uuid, text, text);

-- Create a completely new function with a different name and clear parameter naming
CREATE OR REPLACE FUNCTION public.create_post_report(
  in_post_id uuid,
  in_report_reason text,
  in_report_details text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_report_id uuid;
BEGIN
  -- Check if post exists
  IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = in_post_id) THEN
    RAISE EXCEPTION 'Post does not exist';
  END IF;
  
  -- Check if user has already reported this post
  IF EXISTS (
    SELECT 1 
    FROM public.post_reports 
    WHERE post_reports.post_id = in_post_id 
    AND post_reports.reported_by = auth.uid()
    AND post_reports.status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You have already reported this post';
  END IF;
  
  -- Insert the report
  INSERT INTO public.post_reports (
    post_id, 
    reported_by, 
    reason, 
    details
  )
  VALUES (
    in_post_id, 
    auth.uid(), 
    in_report_reason, 
    in_report_details
  )
  RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for this function
GRANT EXECUTE ON FUNCTION public.create_post_report(uuid, text, text) TO authenticated;

-- Make the function available as a RESTful endpoint
COMMENT ON FUNCTION public.create_post_report(uuid, text, text) IS 'Create a new report for a post';

-- Force schema reload
SELECT pg_notify('pgrst', 'reload schema'); 
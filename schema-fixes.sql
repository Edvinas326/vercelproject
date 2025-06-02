-- 1. Fix inconsistent references
-- Modify the grades table to reference auth.users instead of students
ALTER TABLE public.grades 
    DROP CONSTRAINT IF EXISTS grades_student_id_fkey,
    ADD CONSTRAINT grades_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Standardize the hidden_posts table to reference auth.users directly
ALTER TABLE public.hidden_posts
    DROP CONSTRAINT IF EXISTS hidden_posts_user_id_fkey,
    ADD CONSTRAINT hidden_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Update posts table to reference auth.users instead of profiles
ALTER TABLE public.posts
    DROP CONSTRAINT IF EXISTS posts_user_id_fkey,
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Update post_likes to reference auth.users instead of profiles
ALTER TABLE public.post_likes
    DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey,
    ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- 2. Resolve redundant tables
-- Merge student_classes and class_enrollments

-- First check if student_classes table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'student_classes'
  ) THEN
    -- First, migrate any missing data from student_classes to class_enrollments
    INSERT INTO public.class_enrollments (student_id, class_id, enrolled_at)
    SELECT student_id, class_id, created_at
    FROM public.student_classes
    WHERE NOT EXISTS (
        SELECT 1 FROM public.class_enrollments 
        WHERE student_id = student_classes.student_id 
        AND class_id = student_classes.class_id
    );

    -- Add teacher_id to class_enrollments if needed
    ALTER TABLE public.class_enrollments 
    ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES auth.users(id);

    -- Update teacher_id values from student_classes
    UPDATE public.class_enrollments ce
    SET teacher_id = sc.teacher_id
    FROM public.student_classes sc
    WHERE ce.student_id = sc.student_id 
    AND ce.class_id = sc.class_id
    AND ce.teacher_id IS NULL;

    -- Drop the redundant student_classes table
    DROP TABLE IF EXISTS public.student_classes CASCADE;
  END IF;
END $$;

-- 3. Fix the students table redundancy
-- Check if students table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'students'
  ) THEN
    -- Add any missing columns from students to profiles if needed
    ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS student_id text UNIQUE;

    -- Migrate data from students to profiles
    UPDATE public.profiles p
    SET student_id = s.student_id
    FROM public.students s
    WHERE p.id = s.id
    AND p.student_id IS NULL;

    -- Drop the redundant students table
    DROP TABLE IF EXISTS public.students CASCADE;
  END IF;
END $$;

-- 4. Update any remaining references to students table
ALTER TABLE public.grades
DROP CONSTRAINT IF EXISTS grades_student_id_fkey,
ADD CONSTRAINT grades_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Recreate necessary policies that were dropped with CASCADE
-- Create policies for teachers to manage their students through class_enrollments
DROP POLICY IF EXISTS "Teachers can view their students" ON public.profiles;
CREATE POLICY "Teachers can view their students" ON public.profiles
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.class_enrollments
        WHERE teacher_id = auth.uid() 
        AND student_id = profiles.id
    ));

DROP POLICY IF EXISTS "Teachers can update their students" ON public.profiles;
CREATE POLICY "Teachers can update their students" ON public.profiles
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.class_enrollments
        WHERE teacher_id = auth.uid() 
        AND student_id = profiles.id
    ));

-- Create policies for teachers to manage homework assignments
DROP POLICY IF EXISTS "Teachers can manage homework for their classes" ON public.homework_assignments;
CREATE POLICY "Teachers can manage homework for their classes" ON public.homework_assignments
    FOR ALL
    USING (teacher_id = auth.uid());

-- Create policies for teachers to view student submissions
DROP POLICY IF EXISTS "Teachers can view submissions for their assignments" ON public.homework_submissions;
CREATE POLICY "Teachers can view submissions for their assignments" ON public.homework_submissions
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.homework_assignments
        WHERE homework_assignments.id = homework_submissions.assignment_id
        AND homework_assignments.teacher_id = auth.uid()
    ));

-- 6. Create a stored procedure to update post likes count
-- This function will be properly defined in section 8, removing this redundant definition
-- CREATE OR REPLACE FUNCTION update_post_likes_count(post_id uuid)
-- RETURNS void AS $$
-- BEGIN
--   UPDATE posts
--   SET likes_count = (
--     SELECT count(*)
--     FROM post_likes
--     WHERE post_likes.post_id = update_post_likes_count.post_id
--   )
--   WHERE id = post_id;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create explicit foreign key relationships for posts table
-- First, ensure the foreign key constraints are dropped if they exist
ALTER TABLE public.posts
    DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

-- Create explicit foreign key between posts.user_id and profiles.id
ALTER TABLE public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Make similar adjustments for post_likes
ALTER TABLE public.post_likes
    DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;

ALTER TABLE public.post_likes
    ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- 8. Re-create and properly expose the update_post_likes_count function
DROP FUNCTION IF EXISTS update_post_likes_count;

CREATE OR REPLACE FUNCTION public.update_post_likes_count(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET likes_count = (
    SELECT count(*)
    FROM post_likes
    WHERE post_likes.post_id = update_post_likes_count.post_id
  )
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.update_post_likes_count(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.update_post_likes_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_post_likes_count(uuid) TO service_role;

-- 9. Create a trigger to automatically update post likes count
CREATE OR REPLACE FUNCTION trigger_update_post_likes_count()
RETURNS TRIGGER AS $$
DECLARE
  post_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    post_id := OLD.post_id;
  ELSE
    post_id := NEW.post_id;
  END IF;

  UPDATE posts
  SET likes_count = (
    SELECT count(*)
    FROM post_likes
    WHERE post_id = posts.id
  )
  WHERE id = post_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on post_likes table
DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON post_likes;
CREATE TRIGGER update_post_likes_count_trigger
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW
EXECUTE FUNCTION trigger_update_post_likes_count();

-- 10. Add RLS policies for posts and ensure proper deletion cascades
-- First ensure post_likes has CASCADE delete to avoid constraint errors
ALTER TABLE public.post_likes
  DROP CONSTRAINT IF EXISTS post_likes_post_id_fkey,
  ADD CONSTRAINT post_likes_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- Same for post_replies
ALTER TABLE public.post_replies
  DROP CONSTRAINT IF EXISTS post_replies_post_id_fkey,
  ADD CONSTRAINT post_replies_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- Same for hidden_posts
ALTER TABLE public.hidden_posts
  DROP CONSTRAINT IF EXISTS hidden_posts_post_id_fkey,
  ADD CONSTRAINT hidden_posts_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- Enable RLS on posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own posts
DROP POLICY IF EXISTS "Users can manage their own posts" ON public.posts;
CREATE POLICY "Users can manage their own posts" ON public.posts
  USING (user_id = auth.uid());

-- Add specific policy for delete operations
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE
  USING (user_id = auth.uid());

-- 11. Fix post_likes table permissions and RPC function
-- Enable Row Level Security on post_likes table
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Create policy for post_likes table
DROP POLICY IF EXISTS "Allow users to manage their own likes" ON public.post_likes;
CREATE POLICY "Allow users to manage their own likes" ON public.post_likes
  FOR ALL 
  USING (user_id = auth.uid());

-- Make sure the post_likes table has correct triggers
DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON post_likes;

-- Create update post_likes_count function if not exists
-- Removing redundant definition as this function is already defined in section 8
-- DROP FUNCTION IF EXISTS public.update_post_likes_count;
-- CREATE OR REPLACE FUNCTION public.update_post_likes_count(post_id uuid)
-- RETURNS void AS $$
-- BEGIN
--   UPDATE public.posts
--   SET likes_count = (
--     SELECT count(*)
--     FROM public.post_likes
--     WHERE post_likes.post_id = update_post_likes_count.post_id
--   )
--   WHERE id = post_id;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.update_post_likes_count(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.update_post_likes_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_post_likes_count(uuid) TO service_role;

-- 12. Add post reporting functionality
-- Create a table to store reported posts
CREATE TABLE IF NOT EXISTS public.post_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'rejected', 'action_taken')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on post_reports table
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

-- Users can report posts and view their own reports
DROP POLICY IF EXISTS "Users can report posts" ON public.post_reports;
CREATE POLICY "Users can report posts" ON public.post_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = auth.uid());

DROP POLICY IF EXISTS "Users can view their own reports" ON public.post_reports;
CREATE POLICY "Users can view their own reports" ON public.post_reports
  FOR SELECT
  TO authenticated
  USING (reported_by = auth.uid());

-- Admin/moderator roles can view and manage all reports
DROP POLICY IF EXISTS "Moderators can manage reports" ON public.post_reports;
CREATE POLICY "Moderators can manage reports" ON public.post_reports
  FOR ALL
  TO service_role
  USING (true);

-- Create a function to report a post
CREATE OR REPLACE FUNCTION public.report_post(post_id uuid, reason text, details text DEFAULT NULL)
RETURNS uuid AS $$
DECLARE
  report_id uuid;
BEGIN
  -- Check if post exists
  IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = post_id) THEN
    RAISE EXCEPTION 'Post does not exist';
  END IF;
  
  -- Check if user has already reported this post
  IF EXISTS (
    SELECT 1 FROM public.post_reports 
    WHERE post_id = report_post.post_id 
    AND reported_by = auth.uid()
    AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You have already reported this post';
  END IF;
  
  -- Insert the report
  INSERT INTO public.post_reports (post_id, reported_by, reason, details)
  VALUES (post_id, auth.uid(), reason, details)
  RETURNING id INTO report_id;
  
  RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to use the report_post function
GRANT EXECUTE ON FUNCTION public.report_post(uuid, text, text) TO authenticated;

-- Make the function available as a RESTful endpoint
COMMENT ON FUNCTION public.report_post(uuid, text, text) IS 'Submit a report for a post';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_reports_post_id ON public.post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_reported_by ON public.post_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_post_reports_status ON public.post_reports(status);

-- Add an alternative version of the function with parameters in the order the frontend is sending them
CREATE OR REPLACE FUNCTION public.report_post(details text, post_id uuid, reason text)
RETURNS uuid AS $$
DECLARE
  report_id uuid;
BEGIN
  -- Check if post exists
  IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = post_id) THEN
    RAISE EXCEPTION 'Post does not exist';
  END IF;
  
  -- Check if user has already reported this post
  IF EXISTS (
    SELECT 1 FROM public.post_reports 
    WHERE post_id = report_post.post_id 
    AND reported_by = auth.uid()
    AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You have already reported this post';
  END IF;
  
  -- Insert the report
  INSERT INTO public.post_reports (post_id, reported_by, reason, details)
  VALUES (post_id, auth.uid(), reason, details)
  RETURNING id INTO report_id;
  
  RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the new function signature
GRANT EXECUTE ON FUNCTION public.report_post(text, uuid, text) TO authenticated;

-- Make the new function signature available as a RESTful endpoint
COMMENT ON FUNCTION public.report_post(text, uuid, text) IS 'Submit a report for a post (alternative parameter order)';

-- Create a new unambiguous function name to avoid conflicts
CREATE OR REPLACE FUNCTION public.submit_post_report(input_post_id uuid, input_reason text, input_details text DEFAULT NULL)
RETURNS uuid AS $$
DECLARE
  report_id uuid;
BEGIN
  -- Check if post exists
  IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = input_post_id) THEN
    RAISE EXCEPTION 'Post does not exist';
  END IF;
  
  -- Check if user has already reported this post
  IF EXISTS (
    SELECT 1 FROM public.post_reports pr
    WHERE pr.post_id = input_post_id
    AND pr.reported_by = auth.uid()
    AND pr.status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You have already reported this post';
  END IF;
  
  -- Insert the report
  INSERT INTO public.post_reports (post_id, reported_by, reason, details)
  VALUES (input_post_id, auth.uid(), input_reason, input_details)
  RETURNING id INTO report_id;
  
  RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the new function
GRANT EXECUTE ON FUNCTION public.submit_post_report(uuid, text, text) TO authenticated;

-- Make the new function available as a RESTful endpoint
COMMENT ON FUNCTION public.submit_post_report(uuid, text, text) IS 'Submit a report for a post (unambiguous version)'; 
-- Add category column to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS category text;

-- Set default value for existing records
UPDATE public.posts SET category = 'General' WHERE category IS NULL;

-- Grant privileges on the posts table
GRANT ALL ON TABLE public.posts TO authenticated;
GRANT ALL ON TABLE public.posts TO service_role;

-- Update RLS policies to include the category column
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
CREATE POLICY "Users can insert their own posts" 
ON public.posts FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts" 
ON public.posts FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Public can read all posts
DROP POLICY IF EXISTS "Public can view all posts" ON public.posts;
CREATE POLICY "Public can view all posts" 
ON public.posts FOR SELECT 
TO anon, authenticated
USING (true);

-- Only post owners can delete their posts
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts" 
ON public.posts FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Check that the posts table has the right structure
COMMENT ON TABLE public.posts IS 'Contains user posts with content and category'; 
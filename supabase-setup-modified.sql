-- Create required tables and setup for authentication
-- Modified version that avoids operations requiring auth.users ownership

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  school TEXT,
  role TEXT DEFAULT 'student',
  grade_level TEXT,
  gpa NUMERIC,
  class TEXT,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Add policy for inserting profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Add policy for service role to manage all profiles
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
CREATE POLICY "Service role can manage all profiles" 
  ON public.profiles FOR ALL 
  TO service_role
  USING (true);

-- Allow anonymous users to insert profiles (for signup)
DROP POLICY IF EXISTS "Allow anonymous profile creation" ON public.profiles;
CREATE POLICY "Allow anonymous profile creation" 
  ON public.profiles FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create policies for posts
DROP POLICY IF EXISTS "Everyone can read posts" ON public.posts;
CREATE POLICY "Everyone can read posts" 
  ON public.posts FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
CREATE POLICY "Users can create their own posts" 
  ON public.posts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts" 
  ON public.posts FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" 
  ON public.posts FOR DELETE 
  USING (auth.uid() = user_id);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS on post_likes table
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Create policy for post_likes
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.post_likes;
CREATE POLICY "Users can manage their own likes" 
  ON public.post_likes FOR ALL 
  USING (auth.uid() = user_id);

-- Note: The trigger on auth.users can't be created without special permissions
-- Instead, we'll manually create profiles for new users in our application code

-- Force schema reload
NOTIFY pgrst, 'reload schema'; 
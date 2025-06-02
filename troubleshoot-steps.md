# Troubleshooting the Post Report Function

The error `Could not find the function public.create_post_report(in_post_id, in_report_details, in_report_reason) in the schema cache` indicates that:

1. The function is registered with the parameter names shown in parentheses
2. But the parameters are in a different order than expected

## Step 1: Verify Function Exists

Run this in Supabase SQL Editor:

```sql
SELECT proname, pronargs, proargtypes, proargnames
FROM pg_proc 
WHERE proname = 'create_post_report';
```

## Step 2: Fix the Parameter Ordering Issue

### Option A: Update your SQL function (Recommended)

1. Run this SQL in Supabase SQL Editor:

```sql
-- First, drop any existing functions to start clean
DROP FUNCTION IF EXISTS public.create_post_report(uuid, text, text);

-- Create a function with more explicit parameter handling
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

-- Make sure the function is exposed via the API
COMMENT ON FUNCTION public.create_post_report(uuid, text, text) IS 'Create a new report for a post';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_post_report(uuid, text, text) TO authenticated;

-- Force reload the schema cache
SELECT pg_notify('pgrst', 'reload schema');
```

2. Wait 1-2 minutes for the schema to reload

### Option B: Update your JavaScript code instead

Modify your JavaScript code to use positional parameters explicitly:

```javascript
// Submit the report using positional parameters
const { data, error } = await supabase.rpc(
    'create_post_report',
    [postId, reason, details || null] // Must match the order exactly as in the function
);
```

## Step 3: Test with the Direct API Call Page

1. Open the `direct-api-call.html` file
2. Replace `your-anon-key` with your actual Supabase anon key
3. Open the page in your browser
4. Enter a valid post ID, reason, and optional details
5. Click "Test Direct API Call"

The test will try 3 different methods of calling the function to identify which one works.

## Step 4: If Still Having Issues

If none of the above steps work, try creating a completely new function with a different name:

```sql
CREATE OR REPLACE FUNCTION public.submit_report_v2(
  post_uuid uuid,
  report_reason text,
  report_details text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  new_report_id uuid;
BEGIN
  -- Insert the report directly
  INSERT INTO public.post_reports (
    post_id, 
    reported_by, 
    reason, 
    details
  )
  VALUES (
    post_uuid, 
    auth.uid(), 
    report_reason, 
    report_details
  )
  RETURNING id INTO new_report_id;
  
  RETURN new_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make it available
COMMENT ON FUNCTION public.submit_report_v2(uuid, text, text) IS 'Simple version of post report function';
GRANT EXECUTE ON FUNCTION public.submit_report_v2(uuid, text, text) TO authenticated;

-- Reload schema
SELECT pg_notify('pgrst', 'reload schema');
```

And then update your JavaScript:

```javascript
const { data, error } = await supabase.rpc('submit_report_v2', {
    post_uuid: postId,
    report_reason: reason,
    report_details: details || null
});
```

## Bonus: Debug Information

To get more information about available functions, run:

```sql
SELECT 
  p.proname as function_name,
  pg_catalog.pg_get_function_identity_arguments(p.oid) as argument_types,
  p.proargnames as argument_names,
  d.description
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_description d ON p.oid = d.objoid
JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%report%'
ORDER BY p.proname;
```

This will show all the reporting functions with their parameter names and types. 
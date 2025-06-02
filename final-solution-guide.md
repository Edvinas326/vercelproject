# Comprehensive Guide to Fix Post Reporting Functionality

The error `All object keys must match` typically occurs when there's a mismatch between how the parameters are defined in the PostgreSQL function and how they're being passed from JavaScript.

Here are three different approaches to fix the issue:

## Approach 1: Enable Direct Table Insert (Recommended)

This is the most straightforward and reliable approach, bypassing RPC functions entirely and using Row Level Security to ensure safety.

### Step 1: Apply the SQL fix

1. Open your Supabase dashboard and navigate to the SQL Editor
2. Copy and paste the contents of `direct-insert-fix.sql`
3. Run the SQL script
4. Wait 1-2 minutes for the schema to refresh

### Step 2: Update the JavaScript code

Replace the report submission code in `posts.js` with:

```javascript
try {
    // Show submitting state
    const submitBtn = reportForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    // Get the current user ID
    const { data: { user } } = await supabase.auth.getUser();
    
    // Insert directly into the post_reports table
    const { data, error } = await supabase
        .from('post_reports')
        .insert({
            post_id: postId,
            reported_by: user.id,
            reason: reason,
            details: details || null
            // status will default to 'pending' via trigger
        })
        .select('id')
        .single();
    
    if (error) throw error;
    
    console.log('Report submitted successfully:', data);
    
    // Close the modal
    closeModal();
    
    // Show success message
    showSuccessToast();
    
} catch (error) {
    console.error('Error submitting report:', error);
    
    // Show a user-friendly error message
    let errorMessage = 'Failed to submit report';
    if (error.message) {
        errorMessage += ': ' + error.message;
    } else if (error.details) {
        errorMessage += ': ' + error.details;
    }
    
    alert(errorMessage);
    
    // Re-enable the submit button
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
}
```

## Approach 2: Deploy a Serverless Function

If direct table access isn't preferred, you can use a Supabase Edge Function as an alternative.

### Step 1: Deploy the serverless function

1. If you don't have the Supabase CLI installed, install it with:
   ```
   npm install -g supabase
   ```

2. Initialize and link your project:
   ```
   supabase login
   supabase link --project-ref llymgjymayusaengcdvy
   ```

3. Create a new function:
   ```
   supabase functions new report-post
   ```

4. Copy the contents of `report-post-function.js` to the new function file

5. Deploy the function:
   ```
   supabase functions deploy report-post
   ```

### Step 2: Update the JavaScript code

Replace the report submission code with:

```javascript
try {
    // Show submitting state
    const submitBtn = reportForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    // Call the edge function
    const { data, error } = await supabase.functions.invoke('report-post', {
        body: {
            postId: postId,
            reason: reason,
            details: details || null
        }
    });
    
    if (error) throw error;
    
    console.log('Report submitted successfully:', data);
    
    // Close the modal
    closeModal();
    
    // Show success message
    showSuccessToast();
    
} catch (error) {
    // Error handling code as above
}
```

## Approach 3: Fix the RPC Function (If You Prefer RPC)

If you still want to use the RPC approach, here's a simpler function with fewer potential issues.

### Step 1: Create a simplified function

Run this SQL in your Supabase SQL Editor:

```sql
-- Drop all existing report functions to start clean
DROP FUNCTION IF EXISTS public.report_post(uuid, text, text);
DROP FUNCTION IF EXISTS public.report_post(text, uuid, text);
DROP FUNCTION IF EXISTS public.submit_post_report(uuid, text, text);
DROP FUNCTION IF EXISTS public.create_post_report(uuid, text, text);

-- Create a very simple function with positional parameters only
CREATE OR REPLACE FUNCTION public.report_post_v2(
  p_post_id uuid,
  p_reason text,
  p_details text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_report_id uuid;
BEGIN
  -- Insert the report
  INSERT INTO public.post_reports (
    post_id, 
    reported_by, 
    reason, 
    details,
    status
  )
  VALUES (
    p_post_id, 
    auth.uid(), 
    p_reason, 
    p_details,
    'pending'
  )
  RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.report_post_v2(uuid, text, text) TO authenticated;

-- Expose via API
COMMENT ON FUNCTION public.report_post_v2(uuid, text, text) IS 'Submit a report for a post';

-- Force reload
SELECT pg_notify('pgrst', 'reload schema');
```

### Step 2: Update the JavaScript code

```javascript
try {
    // Show submitting state (as before)...
    
    // Use positional parameters
    const { data, error } = await supabase.rpc(
        'report_post_v2',
        [postId, reason, details || null]
    );
    
    if (error) throw error;
    
    // Success handling (as before)...
    
} catch (error) {
    // Error handling (as before)...
}
```

## Troubleshooting

If you're still encountering issues:

1. **Check for schema cache issues**:
   ```sql
   SELECT pg_notify('pgrst', 'reload schema');
   ```

2. **Verify your function exists**:
   ```sql
   SELECT 
     p.proname as function_name,
     pg_catalog.pg_get_function_identity_arguments(p.oid) as argument_types,
     p.proargnames as argument_names
   FROM pg_catalog.pg_proc p
   JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
   WHERE n.nspname = 'public'
     AND p.proname LIKE '%report%';
   ```

3. **Test direct API call** using the `direct-api-call.html` page (update with your anon key)

4. **Check for Row Level Security issues** by running:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'post_reports';
   ```

5. **Verify table structure**:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'post_reports' 
   ORDER BY ordinal_position;
   ```

Remember, after making SQL changes, always reload the schema and wait a few minutes for the changes to propagate. 
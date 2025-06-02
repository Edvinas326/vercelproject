-- Force PostgREST to reload the schema cache
SELECT pg_notify('pgrst', 'reload schema');

-- Check if the report_post functions exist
SELECT proname, pronargs, proargtypes, prosrc
FROM pg_proc 
WHERE proname IN ('report_post', 'submit_post_report');

-- Check the post_reports table exists
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'post_reports'
ORDER BY ordinal_position;

-- List all exposed functions via RPC
SELECT p.proname as function_name,
       pg_catalog.pg_get_function_identity_arguments(p.oid) as function_arguments
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('report_post', 'submit_post_report'); 
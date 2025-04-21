// This is a Supabase Edge Function that can be used as a fallback
// for submitting post reports if the RPC method fails
// To deploy: supabase functions deploy report-post

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// This function handles report submission
Deno.serve(async (req) => {
  try {
    // Get request body
    const { postId, reason, details } = await req.json();
    
    // Validate input
    if (!postId || !reason) {
      return new Response(
        JSON.stringify({ error: 'postId and reason are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Create Supabase client with admin permissions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    // Get the user ID from auth
    const { error: authError, data: authData } = await supabaseAdmin.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '')
    );
    
    if (authError) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: ' + authError.message }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = authData.user.id;
    
    // Check if the user has already reported this post
    const { data: existingReports, error: existingReportsError } = await supabaseAdmin
      .from('post_reports')
      .select('id')
      .eq('post_id', postId)
      .eq('reported_by', userId)
      .eq('status', 'pending');
      
    if (existingReportsError) {
      return new Response(
        JSON.stringify({ error: 'Error checking existing reports: ' + existingReportsError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (existingReports && existingReports.length > 0) {
      return new Response(
        JSON.stringify({ error: 'You have already reported this post' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if post exists
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();
      
    if (postError) {
      return new Response(
        JSON.stringify({ error: 'Post does not exist or error checking post: ' + postError.message }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Insert the report
    const { data: report, error: reportError } = await supabaseAdmin
      .from('post_reports')
      .insert({
        post_id: postId,
        reported_by: userId,
        reason: reason,
        details: details || null,
        status: 'pending'
      })
      .select('id')
      .single();
      
    if (reportError) {
      return new Response(
        JSON.stringify({ error: 'Error creating report: ' + reportError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Return success
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Report submitted successfully',
        report_id: report.id
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Server error: ' + error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 
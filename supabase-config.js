// Supabase configuration
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://btlkhjvfgotdspjucqhh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bGtoanZmZ290ZHNwanVjcWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDU4OTIsImV4cCI6MjA2MjIyMTg5Mn0.QRw30CjtxaWrwihv2hmEo9SdvaKKjYQcpeTQwWkq2T4'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js/2.0.0'
    }
  }
})

export default supabase 
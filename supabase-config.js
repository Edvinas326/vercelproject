import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://llymgjymayusaengcdvy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxseW1nanltYXl1c2FlbmdjZHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MTA5OTMsImV4cCI6MjA1NTM4Njk5M30.nye3BqcpHJmcSt1KKu6aioaP4NyhyutLcxSnr5Gv_-M'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export default supabase 
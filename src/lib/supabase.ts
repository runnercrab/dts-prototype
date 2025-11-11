import { createClient } from '@supabase/supabase-js'

// HARDCODED TEMPORALMENTE - cambiar después
const supabaseUrl = 'https://fgczfshqldxkyowbyuzq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY3pmc2hxbGR4a3lvd2J5dXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTU1MzMsImV4cCI6MjA3NzU5MTUzM30.nCxVjHv5A8vQawfpUK-SWFbUCTHiHghcYfZfgH7GTFs'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true }
})
